import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Home, AlertCircle, RefreshCw } from 'lucide-react';
import { House, PropertyType } from '../../types/database';
import { createHouse, updateHouse, CreateHouseInput } from '../../services/houseService';

interface HouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  houseToEdit?: House | null;
  onSaved: () => void;
}

export const HouseFormModal: React.FC<HouseFormModalProps> = ({
  isOpen,
  onClose,
  ownerId,
  houseToEdit,
  onSaved,
}) => {
  const isEditing = !!houseToEdit;

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>('appartement');
  const [surface, setSurface] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // File uploads
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [directUrls, setDirectUrls] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (houseToEdit) {
      setTitle(houseToEdit.title);
      setPrice(String(houseToEdit.price));
      setLocation(houseToEdit.location);
      setAddress(houseToEdit.address || '');
      setDescription(houseToEdit.description || '');
      setBedrooms(houseToEdit.bedrooms);
      setBathrooms(houseToEdit.bathrooms);
      setPropertyType(houseToEdit.property_type);
      setSurface(houseToEdit.surface ? String(houseToEdit.surface) : '');
      setIsAvailable(houseToEdit.is_available);
      setSelectedFiles([]);
      setDirectUrls([]);
    } else {
      setTitle('');
      setPrice('');
      setLocation('');
      setAddress('');
      setDescription('');
      setBedrooms(1);
      setBathrooms(1);
      setPropertyType('appartement');
      setSurface('');
      setIsAvailable(true);
      setSelectedFiles([]);
      setDirectUrls([]);
    }
    setError(null);
  }, [houseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddDirectUrl = () => {
    if (directUrlInput.trim().startsWith('http')) {
      setDirectUrls((prev) => [...prev, directUrlInput.trim()]);
      setDirectUrlInput('');
    }
  };

  const removeDirectUrl = (idx: number) => {
    setDirectUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !location.trim()) {
      setError('Veuillez remplir au moins le titre, le prix et la localisation.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Le prix doit être un nombre supérieur à 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (isEditing && houseToEdit) {
      const { error: updateErr } = await updateHouse(houseToEdit.id, {
        title: title.trim(),
        price: numericPrice,
        location: location.trim(),
        address: address.trim() || null,
        description: description.trim() || null,
        bedrooms,
        bathrooms,
        property_type: propertyType,
        surface: surface ? parseFloat(surface) : null,
        is_available: isAvailable,
      });

      setIsSubmitting(false);
      if (updateErr) {
        setError(updateErr);
      } else {
        onSaved();
        onClose();
      }
    } else {
      const input: CreateHouseInput = {
        title: title.trim(),
        price: numericPrice,
        location: location.trim(),
        address: address.trim() || undefined,
        description: description.trim() || undefined,
        bedrooms,
        bathrooms,
        property_type: propertyType,
        surface: surface ? parseFloat(surface) : undefined,
        is_available: isAvailable,
        imageFiles: selectedFiles,
        directImageUrls: directUrls,
      };

      const { house, error: createErr } = await createHouse(ownerId, input);
      setIsSubmitting(false);

      if (createErr) {
        setError(createErr);
      } else if (house) {
        onSaved();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {isEditing ? 'Modifier le logement' : 'Publier une nouvelle annonce'}
              </h2>
              <p className="text-xs text-slate-500">
                Enregistrement direct dans la base de données
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Titre de l'annonce *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Bel appartement lumineux 3 pièces avec balcon"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Type & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Type de bien *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="chambre">Chambre</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Loyer mensuel ($) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ex: 350"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Location & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Quartier / Ville *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ex: Muhumba, Goma"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Adresse précise (optionnel)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Avenue du Lac, n° 14"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Specs: Bedrooms, Bathrooms, Surface */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Chambres
              </label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Salles de bain
              </label>
              <input
                type="number"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Surface (m²)
              </label>
              <input
                type="number"
                min="0"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="ex: 75"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Description complète
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les atouts de votre bien (climatisation, parking, sécurité, proximité des commerces...)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Availability Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">Disponibilité du logement</p>
              <p className="text-[11px] text-slate-500">
                {isAvailable ? 'Visible par les locataires' : 'Marqué comme loué ou indisponible'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          {!isEditing && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-medium text-slate-700">
                Photos réelles du logement
              </label>
              
              {/* File input */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="house-photos-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="house-photos-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">
                    Choisir des photos depuis votre appareil
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PNG, JPG, WebP jusqu'à 5MB par photo
                  </span>
                </label>
              </div>

              {/* Selected files preview list */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Fichiers sélectionnés ({selectedFiles.length}) :
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 bg-slate-100 rounded text-[11px]"
                      >
                        <span className="truncate max-w-[80%] text-slate-700 font-mono">
                          {file.name} ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct URL input option */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-500 mb-1">
                  Ou ajouter directement une URL d'image web :
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectUrl}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
                {directUrls.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {directUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 bg-slate-50 rounded text-[11px] border border-slate-200"
                      >
                        <span className="truncate max-w-[80%] text-slate-600">{url}</span>
                        <button
                          type="button"
                          onClick={() => removeDirectUrl(idx)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
              {isEditing ? 'Enregistrer les modifications' : 'Publier le logement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

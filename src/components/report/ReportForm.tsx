import React, { useState } from 'react';
import { FaCalendarAlt, FaSave, FaTimes } from 'react-icons/fa';

import { ReportService } from '@/lib/report/service';
import type {
  CreateReportDto,
  Report,
  UpdateReportDto,
} from '@/types/report.types';

interface ReportFormProps {
  report?: Report | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: report?.title || '',
    meetingDate: report?.meetingDate ? report.meetingDate.split('T')[0] : '',
    content: report?.content || '',
    attachmentUrl: report?.attachmentUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!report;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const updateData: UpdateReportDto = {
          title: formData.title.trim(),
          meetingDate: formData.meetingDate,
          content: formData.content.trim(),
          attachmentUrl: formData.attachmentUrl.trim() || undefined,
        };
        await ReportService.updateReport(report.id, updateData);
      } else {
        const createData: CreateReportDto = {
          title: formData.title.trim(),
          meetingDate: formData.meetingDate ?? '',
          content: formData.content.trim(),
          attachmentUrl: formData.attachmentUrl.trim() || undefined,
        };
        await ReportService.createReport(createData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!formData.meetingDate) {
      setError('La date de réunion est requise');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Le contenu est requis');
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleSubmit(e);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Modifier le Rapport' : 'Créer un Nouveau Rapport'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing
                  ? 'Modifiez les informations du rapport de réunion'
                  : 'Remplissez les informations pour créer un nouveau rapport de réunion'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Titre du Rapport *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Réunion du Comité - Septembre 2025"
                required
              />
            </div>

            {/* Meeting Date */}
            <div>
              <label
                htmlFor="meetingDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                <FaCalendarAlt className="mr-1 inline" />
                Date de la Réunion *
              </label>
              <input
                type="date"
                id="meetingDate"
                value={formData.meetingDate}
                onChange={(e) =>
                  handleInputChange('meetingDate', e.target.value)
                }
                max={getMaxDate()}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Date à laquelle la réunion a eu lieu
              </p>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Contenu du Rapport *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={12}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Détaillez les points discutés, les décisions prises, les actions à suivre..."
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isEditing ? 'Mettre à jour' : 'Créer le Rapport'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaBookmark,
  FaCopy,
  FaEdit,
  FaPlus,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';

import {
  getRehearsalTypeOptions,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from '@/lib/rehearsal/logic';
import type { RehearsalTemplate } from '@/lib/rehearsal/types';
import { RehearsalType } from '@/lib/rehearsal/types';

import { RehearsalForm } from './RehearsalForm';

interface RehearsalTemplateManagerProps {
  onCreateNewRehearsal: () => void;
  performanceId?: number;
  onClose?: () => void;
}

export const RehearsalTemplateManager: React.FC<
  RehearsalTemplateManagerProps
> = ({ onCreateNewRehearsal, performanceId, onClose }) => {
  const [editingTemplate, setEditingTemplate] =
    useState<RehearsalTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRehearsalForm, setShowRehearsalForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<RehearsalTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    type: RehearsalType.GENERAL_PRACTICE,
    duration: 60,
    objectives: '',
    category: '',
    tags: [] as string[],
    estimatedAttendees: 20,
    difficulty: 'Easy' as 'Easy' | 'Intermediate' | 'Advanced',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );

  const {
    templates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    fetchTemplates,
  } = useTemplates();
  const { updateTemplate, isLoading: isUpdatingTemplate } = useUpdateTemplate();
  const { deleteTemplate, isLoading: isDeletingTemplate } = useDeleteTemplate();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEditTemplate = (template: RehearsalTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      title: template.title,
      type: template.type,
      duration: template.duration,
      objectives: template.objectives,
      category: template.category || '',
      tags: template.tags || [],
      estimatedAttendees: template.estimatedAttendees || 20,
      difficulty: template.difficulty || 'Easy',
    });
    setShowEditModal(true);
  };

  const handleUpdateTemplate = async () => {
    if (editingTemplate && editForm.title) {
      const updatedTemplate: Partial<RehearsalTemplate> = {
        title: editForm.title,
        type: editForm.type,
        duration: editForm.duration,
        objectives: editForm.objectives,
        category: editForm.category,
        tags: editForm.tags,
        estimatedAttendees: editForm.estimatedAttendees,
        difficulty: editForm.difficulty,
      };

      await updateTemplate(editingTemplate.id, updatedTemplate);
      setShowEditModal(false);
      setEditingTemplate(null);
      setEditForm({
        title: '',
        type: RehearsalType.GENERAL_PRACTICE,
        duration: 60,
        objectives: '',
        category: '',
        tags: [],
        estimatedAttendees: 20,
        difficulty: 'Easy' as 'Easy' | 'Intermediate' | 'Advanced',
      });
      fetchTemplates();
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    // Use toast for confirmation instead of window.confirm
    toast.custom((t) => (
      <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
              <svg
                className="text-sm text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              Supprimer le modèle
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce modèle ?
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteTemplate(templateId).then(() => {
                fetchTemplates();
                toast.success('Modèle supprimé avec succès');
              });
            }}
            className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Supprimer
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Annuler
          </button>
        </div>
      </div>
    ));
  };

  const handleUseTemplate = (template: RehearsalTemplate) => {
    setSelectedTemplateId(template.id);

    setSelectedTemplate(template);
    setShowRehearsalForm(true);

    setTimeout(() => setSelectedTemplateId(null), 2000);
  };

  const handleCreateNewRehearsal = () => {
    setSelectedTemplate(null);
    setShowRehearsalForm(true);
  };

  const handleRehearsalFormSuccess = () => {
    setShowRehearsalForm(false);
    setSelectedTemplate(null);
    onCreateNewRehearsal();
  };

  const handleRehearsalFormCancel = () => {
    setShowRehearsalForm(false);
    setSelectedTemplate(null);
  };

  const filteredAndSortedTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.objectives?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;
    const matchesDifficulty =
      !selectedDifficulty || template.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  if (isLoadingTemplates) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <FaBookmark className="text-blue-500" />
            Modèles de répétition
          </h3>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des modèles...</p>
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <FaBookmark className="text-blue-500" />
            Modèles de répétition
          </h3>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Erreur lors du chargement des modèles: {templatesError}
          </p>
          <button
            onClick={fetchTemplates}
            className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
          <FaBookmark className="text-blue-500" />
          Modèles de répétition
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md bg-red-500 p-2 hover:bg-red-600"
            title="Fermer"
          >
            <FaTimes className="text-md text-white" />
          </button>
        )}
      </div>

      <div className="space-y-4 rounded-lg bg-gray-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher des modèles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Toutes les catégories</option>
              <option value="Service dominical">Service dominical</option>
              <option value="Concert">Concert</option>
              <option value="Mariage">Mariage</option>
              <option value="Répétition générale">Répétition générale</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tous les niveaux</option>
              <option value="Easy">Débutant</option>
              <option value="Intermediate">Intermédiaire</option>
              <option value="Advanced">Avancé</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500">
            <FaBookmark className="mx-auto mb-4 text-4xl text-gray-300" />
            <p className="text-lg font-medium">Aucun modèle trouvé</p>
            <p className="mb-6 text-sm">
              {(() => {
                if (searchTerm || selectedCategory || selectedDifficulty) {
                  return 'Essayez de modifier vos critères de recherche';
                }
                if (templates.length === 0) {
                  return 'Aucun modèle valide trouvé. Utilisez le bouton "Debug" pour voir les données brutes, ou "Nettoyer" pour corriger les modèles invalides.';
                }
                return 'Créez votre premier modèle en créant une répétition et en cochant "Sauvegarder comme modèle"';
              })()}
            </p>

            {!searchTerm && !selectedCategory && !selectedDifficulty && (
              <div className="space-y-4">
                <button
                  onClick={handleCreateNewRehearsal}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
                >
                  <FaPlus />
                  Créer une nouvelle répétition
                </button>
                <p className="text-xs text-gray-400">
                  Vous pourrez ensuite la sauvegarder comme modèle pour les
                  prochaines fois
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredAndSortedTemplates.map((template) => (
            <div
              key={template.id}
              className={`rounded-lg border p-4 transition-all duration-300 ${
                selectedTemplateId === template.id
                  ? 'scale-105 border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-gray-900">
                    {template.title}
                  </h4>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${(() => {
                      if (template.type === RehearsalType.GENERAL_PRACTICE)
                        return 'bg-purple-100 text-purple-800';
                      if (
                        template.type === RehearsalType.PERFORMANCE_PREPARATION
                      )
                        return 'bg-indigo-100 text-indigo-800';
                      if (template.type === RehearsalType.DRESS_REHEARSAL)
                        return 'bg-pink-100 text-pink-800';
                      return 'bg-gray-100 text-gray-800';
                    })()}`}
                  >
                    {template.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {selectedTemplateId === template.id && (
                    <div className="animate-pulse text-sm font-medium text-green-600">
                      ✓ Sélectionné
                    </div>
                  )}
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                    title="Modifier"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Supprimer"
                    disabled={isDeletingTemplate}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="mb-4 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Durée:</span>{' '}
                  {template.duration} min
                </div>
                <div>
                  <span className="font-medium">Chansons:</span>{' '}
                  {template.rehearsalSongs?.length || 0}
                </div>
                {template.category && (
                  <div>
                    <span className="font-medium">Catégorie:</span>{' '}
                    {template.category}
                  </div>
                )}
                {template.difficulty && (
                  <div>
                    <span className="font-medium">Niveau:</span>
                    <span
                      className={`ml-1 rounded-full px-2 py-1 text-xs ${(() => {
                        if (template.difficulty === 'Easy')
                          return 'bg-green-100 text-green-800';
                        if (template.difficulty === 'Intermediate')
                          return 'bg-yellow-100 text-yellow-800';
                        return 'bg-red-100 text-red-800';
                      })()}`}
                    >
                      {(() => {
                        if (template.difficulty === 'Easy') return 'Débutant';
                        if (template.difficulty === 'Intermediate')
                          return 'Intermédiaire';
                        return 'Avancé';
                      })()}
                    </span>
                  </div>
                )}
                {template.estimatedAttendees && (
                  <div>
                    <span className="font-medium">Participants:</span>{' '}
                    {template.estimatedAttendees}
                  </div>
                )}
                {template.tags && template.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {template.objectives && (
                  <div>
                    <span className="font-medium">Objectifs:</span>{' '}
                    {template.objectives}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Champs pré-remplis:</span>{' '}
                  Titre, Type, Durée, Objectifs, Chansons
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    title="Utiliser ce modèle pour créer une nouvelle répétition"
                  >
                    <FaCopy />
                    Utiliser ce modèle
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Modifier le modèle
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  setEditForm({
                    title: '',
                    type: RehearsalType.GENERAL_PRACTICE,
                    duration: 60,
                    objectives: '',
                    category: '',
                    tags: [],
                    estimatedAttendees: 20,
                    difficulty: 'Easy' as 'Easy' | 'Intermediate' | 'Advanced',
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Titre du modèle *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Ex: Répétition générale standard"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Type de répétition
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      type: e.target.value as RehearsalType,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {getRehearsalTypeOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Durée par défaut (minutes)
                </label>
                <input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="15"
                  max="240"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Objectifs
                </label>
                <textarea
                  value={editForm.objectives}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      objectives: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Ex: Échauffement vocal, travail sur les harmonies..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Ex: Service dominical, Concert, Mariage"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editForm.tags.join(', ')}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Ex: gospel, harmonies, solos"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre d&apos;participants estimé
                </label>
                <input
                  type="number"
                  value={editForm.estimatedAttendees}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      estimatedAttendees: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  min="5"
                  max="100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Niveau de difficulté
                </label>
                <select
                  value={editForm.difficulty}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value as
                        | 'Easy'
                        | 'Intermediate'
                        | 'Advanced',
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="Easy">Débutant</option>
                  <option value="Intermediate">Intermédiaire</option>
                  <option value="Advanced">Avancé</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTemplate(null);
                    setEditForm({
                      title: '',
                      type: RehearsalType.GENERAL_PRACTICE,
                      duration: 60,
                      objectives: '',
                      category: '',
                      tags: [],
                      estimatedAttendees: 20,
                      difficulty: 'Easy' as
                        | 'Easy'
                        | 'Intermediate'
                        | 'Advanced',
                    });
                  }}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateTemplate}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!editForm.title || isUpdatingTemplate}
                >
                  {isUpdatingTemplate ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Mise à jour...
                    </div>
                  ) : (
                    'Mettre à jour'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rehearsal Form Modal */}
      {showRehearsalForm && (
        <RehearsalForm
          rehearsal={
            selectedTemplate
              ? ({
                  ...selectedTemplate,
                  id: 0, // Use 0 to indicate new rehearsal
                  date: '',
                  location: '',
                  rehearsalLeadId: 0,
                  shiftLeadId: 0,
                  performanceId: performanceId || 0,
                  isTemplate: false,
                  notes: '',
                  musicians: [],
                  status: 'Planning' as any,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as any)
              : undefined
          }
          performanceId={performanceId}
          onSuccess={handleRehearsalFormSuccess}
          onCancel={handleRehearsalFormCancel}
          show={showRehearsalForm}
        />
      )}
    </div>
  );
};

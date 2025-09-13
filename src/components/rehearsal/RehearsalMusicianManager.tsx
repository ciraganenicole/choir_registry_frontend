import React, { useEffect, useState } from 'react';
import { FaEdit, FaMusic, FaPlus, FaTrash } from 'react-icons/fa';

import { getInstrumentOptions } from '@/lib/rehearsal/logic';
import type { CreateRehearsalMusicianDto } from '@/lib/rehearsal/types';
import { InstrumentType } from '@/lib/rehearsal/types';
import { useUsers } from '@/lib/user/useUsers';

interface RehearsalMusicianManagerProps {
  musicians: CreateRehearsalMusicianDto[];
  onMusiciansChange: (musicians: CreateRehearsalMusicianDto[]) => void;
  disabled?: boolean;
}

export const RehearsalMusicianManager: React.FC<
  RehearsalMusicianManagerProps
> = ({ musicians = [], onMusiciansChange, disabled = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMusicianIndex, setEditingMusicianIndex] = useState<
    number | null
  >(null);
  const { users, getUserName, isLoading: isLoadingUsers } = useUsers();
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [newMusician, setNewMusician] = useState<CreateRehearsalMusicianDto>({
    userId: 0,
    instrument: InstrumentType.PIANO,
    customInstrument: '',
    isAccompanist: false,
    isSoloist: false,
    soloStartTime: 0,
    soloEndTime: 0,
    soloNotes: '',
    accompanimentNotes: '',
    needsPractice: false,
    practiceNotes: '',
    order: musicians.length + 1,
    timeAllocated: 0,
    notes: '',
  });

  useEffect(() => {
    if (showAddModal) {
      setNewMusician({
        userId: 0,
        instrument: InstrumentType.PIANO,
        customInstrument: '',
        isAccompanist: false,
        isSoloist: false,
        soloStartTime: 0,
        soloEndTime: 0,
        soloNotes: '',
        accompanimentNotes: '',
        needsPractice: false,
        order: musicians.length + 1,
        timeAllocated: 0,
        notes: '',
      });
      setInstrumentSearchTerm('');
      setUserSearchTerm('');
    }
  }, [showAddModal, musicians.length]);

  const handleAddMusician = () => {
    if (newMusician.userId === 0) {
      return;
    }

    const updatedMusicians = [...musicians, { ...newMusician, id: Date.now() }];
    onMusiciansChange(updatedMusicians);
    setShowAddModal(false);
  };

  const getSelectedUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  };

  const handleEditMusician = (index: number) => {
    const musician = musicians[index];
    if (!musician) return;

    const instrumentOption = getInstrumentOptions().find(
      (opt) => opt.value === musician.instrument,
    );
    const instrumentLabel = instrumentOption
      ? instrumentOption.label
      : musician.instrument;

    const userName = getSelectedUserName(musician?.userId || 0);

    setNewMusician({
      userId: musician.userId,
      instrument: musician.instrument,
      customInstrument: musician.customInstrument || '',
      isAccompanist: musician.isAccompanist,
      isSoloist: musician.isSoloist,
      soloStartTime: musician.soloStartTime || 0,
      soloEndTime: musician.soloEndTime || 0,
      soloNotes: musician.soloNotes || '',
      accompanimentNotes: musician.accompanimentNotes || '',
      needsPractice: musician.needsPractice,
      practiceNotes: musician.practiceNotes || '',
      order: musician.order,
      timeAllocated: musician.timeAllocated || 0,
      notes: musician.notes || '',
    });
    setInstrumentSearchTerm(instrumentLabel);
    setUserSearchTerm(userName);
    setEditingMusicianIndex(index);
    setShowAddModal(true);
  };

  const handleUpdateMusician = () => {
    if (editingMusicianIndex === null || newMusician.userId === 0) return;

    const updatedMusicians = [...musicians];
    const currentMusician = musicians[editingMusicianIndex];
    if (currentMusician) {
      updatedMusicians[editingMusicianIndex] = { ...newMusician };
    }
    onMusiciansChange(updatedMusicians);
    setShowAddModal(false);
    setEditingMusicianIndex(null);
  };

  const handleDeleteMusician = (index: number) => {
    const updatedMusicians = musicians.filter((_, i) => i !== index);
    onMusiciansChange(updatedMusicians);
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingMusicianIndex(null);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Musiciens</h3>
        {!disabled && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FaPlus className="mr-2" />
            Défense
          </button>
        )}
      </div>

      {musicians.length > 0 ? (
        <div className="space-y-3">
          {musicians.map((musician, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {getUserName(musician?.userId || 0)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {musician.customInstrument || musician.instrument}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {musician.isAccompanist && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Accompagnateur
                    </span>
                  )}
                  {musician.isSoloist && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                      Soliste
                    </span>
                  )}
                  {musician.needsPractice && (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Nécessite de la pratique
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {musician.isSoloist &&
                  musician.soloStartTime &&
                  musician.soloEndTime && (
                    <div>
                      <span className="font-medium">Solo:</span>{' '}
                      {formatTime(musician.soloStartTime)} -{' '}
                      {formatTime(musician.soloEndTime)}
                    </div>
                  )}

                {musician.timeAllocated && musician.timeAllocated > 0 && (
                  <div>
                    <span className="font-medium">Temps alloué:</span>{' '}
                    {musician.timeAllocated} min
                  </div>
                )}

                <div>
                  <span className="font-medium">Ordre:</span> {musician.order}
                </div>
              </div>

              {musician.soloNotes && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Notes de solo:</span>{' '}
                    {musician.soloNotes}
                  </p>
                </div>
              )}

              {musician.accompanimentNotes && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">
                      Notes d&apos;accompagnement:
                    </span>{' '}
                    {musician.accompanimentNotes}
                  </p>
                </div>
              )}

              {musician.practiceNotes && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Notes de pratique:</span>{' '}
                    {musician.practiceNotes}
                  </p>
                </div>
              )}

              {musician.notes && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Notes:</span> {musician.notes}
                  </p>
                </div>
              )}

              {!disabled && (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => handleEditMusician(index)}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FaEdit className="mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteMusician(index)}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <FaTrash className="mr-1" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <FaMusic className="mx-auto mb-4 size-12 text-gray-400" />
          <p>Aucun musicien ajouté</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingMusicianIndex !== null
                  ? 'Modifier la défense'
                  : 'Défense'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Utilisateur *{' '}
                    {newMusician.userId !== 0 && (
                      <span className="ml-2 text-xs text-green-600">
                        ✓ Sélectionné
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder={
                        isLoadingUsers
                          ? 'Chargement...'
                          : 'Tapez pour rechercher un utilisateur...'
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      disabled={isLoadingUsers}
                      onFocus={() => setShowUserDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowUserDropdown(false), 200)
                      }
                    />
                    {showUserDropdown && !isLoadingUsers && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                        {users
                          .filter((user) =>
                            `${user.firstName} ${user.lastName}`
                              .toLowerCase()
                              .includes(userSearchTerm.toLowerCase()),
                          )
                          .sort((a, b) =>
                            `${a.firstName} ${a.lastName}`.localeCompare(
                              `${b.firstName} ${b.lastName}`,
                            ),
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewMusician((prev) => ({
                                  ...prev,
                                  userId: user.id,
                                }));
                                setUserSearchTerm('');
                                setShowUserDropdown(false);
                              }}
                            >
                              {user.firstName} {user.lastName}
                            </div>
                          ))}
                        {users.filter((user) =>
                          `${user.firstName} ${user.lastName}`
                            .toLowerCase()
                            .includes(userSearchTerm.toLowerCase()),
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Aucun utilisateur trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Instrument *{' '}
                    {newMusician.instrument &&
                      newMusician.instrument !== InstrumentType.PIANO && (
                        <span className="ml-2 text-xs text-green-600">
                          ✓ Sélectionné
                        </span>
                      )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instrumentSearchTerm}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setInstrumentSearchTerm(searchTerm);

                        const foundInstrument = getInstrumentOptions().find(
                          (option) =>
                            option.label
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                        );

                        if (
                          foundInstrument &&
                          searchTerm === foundInstrument.label
                        ) {
                          setNewMusician((prev) => ({
                            ...prev,
                            instrument: foundInstrument.value as InstrumentType,
                            customInstrument:
                              foundInstrument.value === InstrumentType.OTHER
                                ? prev.customInstrument
                                : '',
                          }));
                        }
                      }}
                      placeholder="Tapez pour rechercher un instrument..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      onFocus={() => setShowInstrumentDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowInstrumentDropdown(false), 200)
                      }
                    />
                    {showInstrumentDropdown && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                        {getInstrumentOptions()
                          .filter((option) =>
                            option.label
                              .toLowerCase()
                              .includes(instrumentSearchTerm.toLowerCase()),
                          )
                          .map((option) => (
                            <div
                              key={option.value}
                              className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewMusician((prev) => ({
                                  ...prev,
                                  instrument: option.value as InstrumentType,
                                  customInstrument:
                                    option.value === InstrumentType.OTHER
                                      ? prev.customInstrument
                                      : '',
                                }));
                                setInstrumentSearchTerm(option.label);
                                setShowInstrumentDropdown(false);
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        {getInstrumentOptions().filter((option) =>
                          option.label
                            .toLowerCase()
                            .includes(instrumentSearchTerm.toLowerCase()),
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Aucun instrument trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Instrument */}
                {newMusician.instrument === InstrumentType.OTHER && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Instrument personnalisé *
                    </label>
                    <input
                      type="text"
                      value={newMusician.customInstrument}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          customInstrument: e.target.value,
                        }))
                      }
                      placeholder="Spécifier l'instrument"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Checkboxes */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newMusician.isAccompanist}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          isAccompanist: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Accompagnateur
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newMusician.isSoloist}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          isSoloist: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Soliste</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newMusician.needsPractice}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          needsPractice: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Nécessite de la pratique
                    </span>
                  </label>
                </div>

                {/* Solo Time Range */}
                {newMusician.isSoloist && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Début du solo (mm:ss)
                      </label>
                      <input
                        type="text"
                        value={formatTime(newMusician.soloStartTime || 0)}
                        onChange={(e) =>
                          setNewMusician((prev) => ({
                            ...prev,
                            soloStartTime: parseTime(e.target.value),
                          }))
                        }
                        placeholder="0:00"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fin du solo (mm:ss)
                      </label>
                      <input
                        type="text"
                        value={formatTime(newMusician.soloEndTime || 0)}
                        onChange={(e) =>
                          setNewMusician((prev) => ({
                            ...prev,
                            soloEndTime: parseTime(e.target.value),
                          }))
                        }
                        placeholder="0:00"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Time Allocated */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Temps alloué (minutes)
                  </label>
                  <input
                    type="number"
                    value={newMusician.timeAllocated}
                    onChange={(e) =>
                      setNewMusician((prev) => ({
                        ...prev,
                        timeAllocated: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    min="0"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={newMusician.order}
                    onChange={(e) =>
                      setNewMusician((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    min="1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={newMusician.notes}
                    onChange={(e) =>
                      setNewMusician((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Notes additionnelles..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Solo Notes */}
                {newMusician.isSoloist && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notes de solo
                    </label>
                    <textarea
                      value={newMusician.soloNotes || ''}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          soloNotes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Notes spécifiques au solo..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Accompaniment Notes */}
                {newMusician.isAccompanist && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notes d&apos;accompagnement
                    </label>
                    <textarea
                      value={newMusician.accompanimentNotes}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          accompanimentNotes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Notes d'accompagnement..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Practice Notes */}
                {newMusician.needsPractice && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Notes de pratique
                    </label>
                    <textarea
                      value={newMusician.practiceNotes}
                      onChange={(e) =>
                        setNewMusician((prev) => ({
                          ...prev,
                          practiceNotes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Notes de pratique..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={handleCancel}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  onClick={
                    editingMusicianIndex !== null
                      ? handleUpdateMusician
                      : handleAddMusician
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingMusicianIndex !== null ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

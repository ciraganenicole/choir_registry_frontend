import { useState } from 'react';
import Select from 'react-select';

import Popup from '@/components/popup';

import { useLeave } from './logic';

interface CreateLeaveProps {
  onClose: () => void;
  onUserCreated: () => void;
}

const AddLeave: React.FC<CreateLeaveProps> = ({ onClose }) => {
  const { users, markLeave, loading } = useLeave();
  const [userId, setUserId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState<string>('');

  const leaveTypes = [
    { value: 'sick', label: 'Maladie' },
    { value: 'suspension', label: 'Suspension' },
    { value: 'vacation', label: 'Vacances' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Travail' },
    { value: 'Other', label: 'Autres' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userId && startDate && leaveType) {
      // Ensure `endDate` is either empty string or omitted if not provided
      const leaveData = {
        startDate,
        leaveType,
        endDate: endDate || '', // Send an empty string if endDate is not provided
        reason: 'Leave request', // Add a default reason
      };

      try {
        await markLeave(userId, leaveData);
        alert('Leave marked successfully!');
      } catch (error) {
        alert('Error marking leave, please try again.');
      }
    } else {
      alert('Please fill in all fields.');
    }
  };

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));

  const handleSelectChange = (selectedOption: any) => {
    setUserId(selectedOption ? selectedOption.value : null);
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const date = e.target.value;
    if (field === 'startDate') {
      setStartDate(date);
    } else if (field === 'endDate') {
      setEndDate(date);
    }
  };

  const handleLeaveTypeChange = (selectedOption: any) => {
    setLeaveType(selectedOption ? selectedOption.value : '');
  };

  return (
    <Popup title="Add Leave" onClose={onClose} style="md:w-[40%]">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-gray-700">User</label>
          <Select
            options={userOptions}
            onChange={handleSelectChange}
            value={userOptions.find(
              (option) => option.value === Number(userId),
            )}
            className="w-full"
            placeholder="Select a user"
            isSearchable
          />
        </div>

        <div>
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: any) => handleDateChange(e, 'startDate')}
            className="w-full rounded-md border px-3 py-2 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">End Date (optional)</label>
          <input
            type="date"
            name="endDate"
            value={endDate || ''}
            onChange={(e: any) => handleDateChange(e, 'endDate')}
            className="w-full rounded-md border px-3 py-2 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700">Leave Type</label>
          <Select
            options={leaveTypes}
            onChange={handleLeaveTypeChange}
            value={leaveTypes.find((option) => option.value === leaveType)}
            className="w-full"
            placeholder="Select leave type"
            isSearchable
            required
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save Leave'}
          </button>
        </div>
      </form>
    </Popup>
  );
};

export default AddLeave;

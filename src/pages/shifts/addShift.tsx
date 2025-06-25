import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { Button } from '@/components/button';
import Input from '@/components/input';
import SelectInput from '@/components/selectInput';

const AddEmployeeForm = () => {
  // Redux state and dispatch
  const { shifts } = useSelector((state: any) => state.shifts);
  const { users } = useSelector((state: any) => state?.users);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const animatedComponents = makeAnimated();
  // Component state
  const [newShift, setNewShift] = useState({
    startDate: '',
    endDate: '',
    shiftId: null,
    userIDs: [],
  });

  // Event handlers
  const handleChange = (e: any) => {
    setNewShift((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUsersChange = (selectedValues: any) => {
    setSelectedUserIds(selectedValues);
  };

  const allIDs = selectedUserIds.map((user) => user);
  // Update synchronizing the userIDs in the newShift object
  useEffect(() => {
    setNewShift((prev: any) => ({
      ...prev,
      userIDs: allIDs,
    }));
  }, [allIDs]);

  // JSX rendering
  return (
    <form className="flex flex-col items-start">
      <Input
        type="date"
        name="startDate"
        label="Start Date"
        placeholder="Select the start date"
        value={newShift.startDate}
        onChange={handleChange}
      />
      <Input
        type="date"
        name="endDate"
        label="End Date"
        placeholder="Select the end date"
        value={newShift.endDate}
        onChange={handleChange}
      />

      <SelectInput
        placeholder="Select shift"
        options={
          shifts &&
          shifts.map((shift: any) => ({
            value: shift.id,
            label: `${shift.shiftName} (${shift.startTime} - ${shift.endTime})`,
          }))
        }
        onChange={handleChange}
      />

      <div className="mb-4 w-full rounded-[5px] ">
        <p className="text-primary/50 mb-1">Select Users</p>
        <Select
          closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          options={
            users &&
            users.map((user: any) => ({ value: user.id, label: user.name }))
          }
          menuPlacement="top"
          value={
            selectedUserIds.length > 0 &&
            // dispatch the userIDs in the newShift object
            selectedUserIds.map((user: any) => ({
              value: user.value,
              label: user.label,
            }))
          }
          name="userIDs"
          onChange={handleUsersChange}
          className="border-radius-[5px] border-primary mb-4 w-full rounded-[5px] border text-sm"
        />
      </div>

      <div className="flex flex-row gap-2">
        <Button>Annuler</Button>
        <Button>Enregistrer</Button>
      </div>
    </form>
  );
};

export default AddEmployeeForm;

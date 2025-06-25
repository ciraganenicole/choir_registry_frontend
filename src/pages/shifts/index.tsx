import React from 'react';
import { useSelector } from 'react-redux';

import Dialog from '@/components/dialog';
import Layout from '@/components/layout';

import AddEmployeeForm from './addShift';
import ShiftList from './list';

const ShiftPage = () => {
  const [showForm, setShowForm] = React.useState(false);
  const { shiftsWithEmployees } = useSelector((state: any) => state.shifts);
  const handleClick = () => {
    setShowForm(!showForm);
  };

  return (
    <Layout>
      <div className="bg-background flex items-center justify-end">
        <h1 className=" bg-primary px-36 py-2 text-white">Week-1/October</h1>
      </div>
      <div className="bg-background p-4">
        <div className="my-4 flex flex-row items-center justify-between">
          {showForm && (
            <Dialog title="Assign shift" width="w-[30%]" onClose={handleClick}>
              <AddEmployeeForm />
            </Dialog>
          )}
          {/* <Button
            width="bg-secondary text-white px-8 py-2 rounded-[5px] ml-1"
            type="button"
            label="Generate Report"
            onClick={handleShowExport}
          /> */}
        </div>

        <ShiftList shiftData={shiftsWithEmployees} />
      </div>
    </Layout>
  );
};
export default ShiftPage;

import React, { useState } from 'react';

import Input from '@/components/input';

const UserRegistration: React.FC = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:4000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData: { name, surname, phoneNumber } }),
      });

      if (response.status === 201) {
        alert('User registered successfully!');
        setName('');
        setSurname('');
        setPhoneNumber('');
      } else {
        alert('Error registering user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to the server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Register New User
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              name="name"
              label="Name"
              placeholder=""
              onChange={(e: any) => setName(e)}
            />
          </div>

          <div className="mb-4">
            <Input
              name="surname"
              label="Surname"
              placeholder=""
              onChange={(e: any) => setSurname(e)}
            />
          </div>

          <div className="mb-4">
            <Input
              name="phoneNumber"
              label="Telephone"
              placeholder=""
              onChange={(e: any) => setPhoneNumber(e)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Register User
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;

// userActions.ts

export const updateUser = async (id: number, updatedData: any) => {
  try {
    const response = await fetch(`http://localhost:4000/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const updatedUser = await response.json();

    console.log('User updated successfully:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

export const deleteUser = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:4000/users/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 200) {
      console.log(`User with ID: ${id} deleted successfully`);
    } else {
      console.error(`Failed to delete user with ID: ${id}`);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

export const viewUser = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:4000/users/${id}`);
    const user = await response.json();
    console.log('User Details:', user);
  } catch (error) {
    console.error('Error viewing user:', error);
  }
};

// Fetch all users
export const fetchUsers = async (): Promise<any[]> => {
  try {
    const response = await fetch('http://localhost:4000/users');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

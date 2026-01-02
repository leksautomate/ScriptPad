const STORAGE_KEY = 'script-pad-data';

export const getScripts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
};

export const saveScript = (script) => {
  const scripts = getScripts();
  const index = scripts.findIndex(s => s.id === script.id);
  let newScripts;
  if (index >= 0) {
    newScripts = [...scripts];
    newScripts[index] = { ...script, updatedAt: Date.now() };
  } else {
    newScripts = [...scripts, { ...script, createdAt: Date.now(), updatedAt: Date.now() }];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts));
  return newScripts; // Return updated list for state update
};

export const deleteScript = (id) => {
  const scripts = getScripts();
  const newScripts = scripts.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts));
  return newScripts;
};

export const saveAllScripts = (scripts) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
};

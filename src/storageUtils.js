const STORAGE_KEY = 'script-pad-data';
const COLLECTIONS_KEY = 'script-pad-collections';

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
  return newScripts;
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

// Collections
export const getCollections = () => {
  try {
    const data = localStorage.getItem(COLLECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading collections from localStorage', error);
    return [];
  }
};

export const saveCollection = (collection) => {
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === collection.id);
  let newCollections;
  if (index >= 0) {
    newCollections = [...collections];
    newCollections[index] = { ...collection, updatedAt: Date.now() };
  } else {
    newCollections = [...collections, { ...collection, createdAt: Date.now() }];
  }
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
  return newCollections;
};

export const deleteCollection = (id) => {
  const collections = getCollections();
  const newCollections = collections.filter(c => c.id !== id);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(newCollections));
  return newCollections;
};

export const saveAllCollections = (collections) => {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
};

export const getLocalized = (item: any, field: 'title' | 'description' | 'name', language: string) => {
  if (!item) return '';
  
  if (language === 'ku') {
    return item[field] || '';
  }
  
  const localizedField = `${field}_${language}`;
  return item[localizedField] || item[field] || '';
};

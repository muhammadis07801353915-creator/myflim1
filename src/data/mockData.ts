export const movies = [
  { id: 1, title: 'Kalki 2898 AD', type: 'Movie', rating: 9.2, year: 2024, genre: 'Sci-Fi, Action', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800&h=400', description: 'A modern-day avatar of Vishnu descends to Earth to protect the world from evil forces.' },
  { id: 2, title: 'Joker', type: 'Movie', rating: 8.4, year: 2019, genre: 'Crime, Drama', image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=800&h=400', description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.' },
  { id: 3, title: 'Spider-Man: Remastered', type: 'Movie', rating: 9.2, year: 2022, genre: 'Action, Adventure', image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=800&h=400', description: 'Peter Parker, battling classic villains like Green Goblin and Doc Ock, juggling college life and hero duties.' },
  { id: 4, title: 'Interstellar', type: 'Movie', rating: 8.6, year: 2014, genre: 'Adventure, Drama, Sci-Fi', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800&h=400', description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.' },
  { id: 5, title: 'Game Of Thrones', type: 'Series', rating: 9.2, year: 2011, genre: 'Action, Adventure, Drama', image: 'https://images.unsplash.com/photo-1544822688-c5f41d2c1970?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1544822688-c5f41d2c1970?auto=format&fit=crop&q=80&w=800&h=400', description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.' },
  { id: 6, title: 'Money Heist', type: 'Series', rating: 8.2, year: 2017, genre: 'Action, Crime, Drama', image: 'https://images.unsplash.com/photo-1627454820516-dc76715ea551?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1627454820516-dc76715ea551?auto=format&fit=crop&q=80&w=800&h=400', description: 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history.' },
  { id: 7, title: 'No Time To Die', type: 'Movie', rating: 7.3, year: 2021, genre: 'Action, Adventure', image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&q=80&w=800&h=400', description: 'James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help.' },
  { id: 8, title: 'Dune', type: 'Movie', rating: 8.0, year: 2021, genre: 'Action, Adventure, Drama', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400&h=600', backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800&h=400', description: 'Feature adaptation of Frank Herbert\'s science fiction novel.' },
];

export const liveCategories = [
  'All', 'News', 'Sports', 'Movies', 'Entertainment', 'Education', 'Cooking', 'Kids', 'Music', 'Religion', 'Culture', 'Documentary'
];

export const channels = [
  // News
  { id: 1, name: 'K24', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Kurdistan24_Logo.png/600px-Kurdistan24_Logo.png' },
  { id: 2, name: 'Rudaw', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Rudaw_Media_Network_logo.svg/1200px-Rudaw_Media_Network_logo.svg.png' },
  { id: 3, name: 'AVA', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Ava_Entertainment_Logo.png' },
  { id: 4, name: 'Channel 8', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Channel_8_logo.svg/1200px-Channel_8_logo.svg.png' },
  { id: 5, name: 'NRT News', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/NRT_News_logo.svg/1200px-NRT_News_logo.svg.png' },
  { id: 6, name: 'Al Jazeera', category: 'News', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/1200px-Aljazeera_eng.svg.png' },
  
  // Sports
  { id: 7, name: 'myKORA 1', category: 'Sports', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 8, name: 'myKORA 2', category: 'Sports', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 9, name: 'myUFC', category: 'Sports', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 10, name: 'AVA Sport', category: 'Sports', image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Ava_Entertainment_Logo.png' },
  { id: 11, name: 'EYE 1', category: 'Sports', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 12, name: 'NRT Sport', category: 'Sports', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/NRT_News_logo.svg/1200px-NRT_News_logo.svg.png' },

  // Education
  { id: 13, name: 'Hewler HD', category: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 14, name: 'Duhok HD', category: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 15, name: 'Parwardayi', category: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=200&h=200' },

  // Cooking
  { id: 16, name: 'Samira', category: 'Cooking', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 17, name: 'Sofra', category: 'Cooking', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 18, name: 'Food Panorama', category: 'Cooking', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200&h=200' },
];

export const banners = [
  { id: 1, image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800&h=200', link: '#' },
  { id: 2, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=200', link: '#' },
  { id: 3, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800&h=200', link: '#' },
];

import type { AgeCategory, FoodCategory, FoodStatus, Reaction } from './types';

export const weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
export const days = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
export const mealTimes = ['Sarapan', 'Tengah Hari', 'Petang', 'Malam'];
export const trackerMealTimes = ['Pagi', 'Petang', 'Malam', 'Snacking'];
export const reactions: Reaction[] = ['Belum Dinilai', '❤️ Sangat Suka', '😊 Suka', '😐 Biasa', '🤔 Tak Pasti', '😖 Tidak Suka', '⚠️ Ada Reaksi'];
export const ageCategories: AgeCategory[] = ['6 Bulan', '7 Bulan', '8 Bulan', '9 Bulan', '10 Bulan', '11 Bulan', '12 Bulan Ke Atas'];
export const foodCategories: FoodCategory[] = ['Buah', 'Sayur', 'Protein', 'Bubur', 'Finger Food', 'Snek', 'Lain-Lain'];
export const foodStatuses: FoodStatus[] = ['Selamat', 'Perlu Dipantau', 'Alergi'];

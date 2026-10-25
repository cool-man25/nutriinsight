// AUTO-GENERATED: backend/db/schema.ts
// This file is assembled from installed capability schema pieces.

import { pgTable, text, integer, real, jsonb, timestamp, index, boolean, bigint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const nutriProfiles = pgTable('nutri_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  heightCm: integer('height_cm').notNull(),
  weightKg: real('weight_kg').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  activityLevel: text('activity_level').notNull(),
  goal: text('goal').notNull(),
  allergies: text('allergies').notNull().default(''),
  preferences: text('preferences').notNull().default(''),
  onboarded: boolean('onboarded').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const nutriMeals = pgTable(
  'nutri_meals',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id').notNull(),
    mealType: text('meal_type').notNull(),
    name: text('name').notNull(),
    eatDate: text('eat_date').notNull(),
    eatTime: text('eat_time').notNull(),
    photoUrl: text('photo_url'),
    foods: jsonb('foods').notNull().default([]),
    calories: real('calories').notNull().default(0),
    protein: real('protein').notNull().default(0),
    carbs: real('carbs').notNull().default(0),
    fat: real('fat').notNull().default(0),
    fiber: real('fiber').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    profileDateIdx: index('nutri_meals_profile_date_idx').on(table.profileId, table.eatDate),
  }),
);

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auto-generate insert schema from table, override custom validation only
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Update schema - all fields optional
export const updateUserSchema = insertUserSchema.partial();

// Login schema - define explicitly to avoid brittle pick() masks when user fields change
export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Signup schema - define explicitly so auth stays stable even if insertUserSchema changes
export const signupUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Uploads Table (file-upload capability)
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text('user_id').notNull(),
  uploadId: text('upload_id').notNull().unique(),
  fileName: text('file_name').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  userId: z.string().min(1),
  uploadId: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
  s3Url: z.string().min(1),
  status: z.string().optional(),
});

export const updateUploadSchema = insertUploadSchema.partial();

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

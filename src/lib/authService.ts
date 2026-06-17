import { supabase } from './supabase';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}
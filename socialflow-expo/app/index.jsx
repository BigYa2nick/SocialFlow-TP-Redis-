import { Redirect } from 'expo-router';

// Point d'entrée de l'app
// Expo-router a besoin d'un index à la racine
// On laisse le _layout gérer la redirection selon l'état de connexion
export default function Index() {
  return <Redirect href="/auth/login" />;
}
# منصة تسجيل المتربصين

Application arabe autonome : inscriptions à plusieurs stages, justificatifs privés, validation, paiement intégral, présence, QR code, export Excel et impression PDF.

## Exécution

Node.js 22 ou supérieur. Copier `.env.example` vers `.env` et renseigner l'URL et la clé **publique** Supabase. Puis `npm ci`, `npm run dev`. `npm run build` génère le site statique dans `dist/`. Il peut être publié dans un sous-dossier GitHub Pages.

## Architecture

- Interface React et Supabase Auth : compte organisateur par e-mail et mot de passe ; les candidats n'ont pas de compte.
- Tables `training_admins`, `training_stages`, `training_applicants` protégées par RLS.
- Bucket privé `training-documents` ; accès temporaire aux documents réservé à l'organisateur.
- Fonction `training-registration` : formulaire public, vérification des informations et des justificatifs, absence de frais dans la réponse publique, blocage des doublons et nettoyage des fichiers en cas d'échec.
- La clé privilégiée reste exclusivement dans les variables du serveur Supabase.
- Chaque dossier conserve le montant applicable à son dépôt. Les paiements et la présence sont enregistrés séparément.

Le dossier `database/` décrit le schéma installé. Les migrations du projet Supabase constituent l'historique appliqué. La table `training_bootstrap` réserve l'activation initiale ; son secret n'est pas stocké dans ce dépôt. Aucun compte ChatGPT n'est nécessaire pour utiliser cette application.

## Utilisation

1. L'organisateur active son compte depuis le lien privé qui lui est remis, puis choisit son mot de passe.
2. Créer un stage, sélectionner les pièces et cocher celles qui sont obligatoires.
3. Partager son lien ou QR code avec les candidats.
4. Examiner les dossiers ; accepter ou refuser.
5. Enregistrer le paiement intégral pour confirmer l'inscription, puis la présence au stage.

Les exports respectent les filtres affichés. PDF utilise la fonction « Enregistrer au format PDF » du navigateur. Les justificatifs acceptés sont PDF, PNG, JPEG et WEBP, jusqu'à 5 MB par fichier et 25 MB par dossier.

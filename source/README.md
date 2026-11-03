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

## Suppression et droits des organisateurs

Chaque organisateur approuvé dispose de toutes les fonctions pour ses propres stages. La propriété est contrôlée par Supabase RLS pour les stages, les inscriptions et les justificatifs. Le stage existant est attribué à son organisateur actuel. Un autre compte organisateur ne voit pas ces dossiers. Les formulaires publics restent accessibles aux candidats par leurs liens de stage.

Le bouton « حذف » déplace une inscription vers « المحذوفة ». « استرجاع » permet de la restaurer. Les dossiers supprimés ne figurent plus dans les listes et totaux courants. Une réinscription active identique empêche la restauration pour éviter les doublons.

Pour une installation neuve, appliquer `database/schema.sql`, puis `database/organizer_scope_and_registration_trash.sql`. Le test SQL `tests/organizer_scope.sql` utilise une transaction annulée : il vérifie l’isolation réciproque de deux organisateurs, l’accès aux justificatifs, les écritures refusées, la suppression et la restauration.

## Présentation

La présentation validée utilise des cartes en nuances de vert, jaune et rouge, avec le logo circulaire fourni par l’organisation. Les cartes et les listes se réorganisent sur téléphone. Les valeurs affichées proviennent des stages et dossiers de l’organisateur connecté.

## Badges des participants

Le formulaire demande le sexe (ذكر / أنثى). Les dossiers antérieurs conservent une valeur non précisée : l’organisateur doit la renseigner et enregistrer le dossier avant de générer son badge. Aucune valeur n’est déduite du nom.

« البطاقة » ouvre une carte individuelle ; « بطاقات المشاركين » prépare les badges de la liste filtrée. Chaque badge mesure 85 × 120 mm en portrait et contient le prénom, le nom, le titre et les dates du stage ainsi que مدرب ou مدربة. La prévisualisation permet d’imprimer ou de sauvegarder en PDF, avec une page par badge. Sélectionner une échelle de 100 %. Appliquer `database/registration_gender.sql` après les schémas précédents pour une installation neuve.

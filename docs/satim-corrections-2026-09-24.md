# Corrections demandées par SATIM — 24 septembre 2026

Source : e-mail « Demande de correction (Noureddine Haouari) » de Brahim CHEIKH BEKOUR (SATIM), 24 septembre 2026 à 11:40, copie Hamid HADDOUCHE, Hocine ABIDA et GP_CERTIF. Site testé : https://demo.wathiqpay.com.

## Analyse des remarques

| # | Page | Remarque de SATIM | Interprétation | Correction appliquée | Commit |
|---|---|---|---|---|---|
| 1 | Paiement | Absence de logo CIB/Edahabia ; « retirer le paragraphe encadré en rouge » | Le paragraphe « Les articles, prix et commandes servent uniquement à tester WathiqPay… » placé juste au-dessus du bouton | Paragraphe supprimé de la page de paiement | 9cd4cc1 |
| 2 | Paiement | « Retirer la mention Tester, et mettre le bon logo CIB/Edahabia » | Le bouton indiquait « Tester le paiement » et affichait la bannière d'accueil de la page SATIM au lieu du logo | Bouton « Payer 1 200,00 DZD » avec le logo combiné CIB / Edahabia (الذهبية, Algérie Poste), agrandi | 9cd4cc1, 4aeecea |
| 3 | Paiement accepté | « Retirer la mention SATIM à l'endroit indiqué » | Libellé « Identifiant de transaction SATIM » | Libellé « Identifiant de transaction » (FR), « Transaction ID » (EN), « معرّف المعاملة » (AR), sur la page, le reçu imprimable, le PDF et l'e-mail | 9cd4cc1 |
| 4 | Paiement accepté | « Ajouter un logo ou votre nom d'entreprise sur le reçu » | Le reçu ne portait pas le nom du marchand | « Maison Wathiq » en tête du reçu (page et impression) et en titre du PDF | 9cd4cc1 |
| 5 | Paiement accepté | « Ajouter le statut de la transaction sur le reçu » | Le statut n'apparaissait que dans le titre de la page | Ligne « Statut : Paiement accepté » sur la page, le reçu imprimable, le PDF et l'e-mail | 9cd4cc1 |
| 6 | Paiement rejeté | « Retirer le numéro de commande et l'identifiant de la transaction » | Ces deux lignes étaient affichées sur la page de refus | Supprimées ; la page garde le message de refus, le montant et le 3020 | 9cd4cc1, 4aeecea |

Tests automatisés ajoutés pour chaque remarque (72 tests au total, tous réussis). Preuves sur le site en ligne : `docs/evidence/2026-09-24/`.

Provenance du logo : `examples/reference-merchant/public/images/PAYMENT-ARTWORK.md`.

## Checklist de vérification après correction

À faire sur https://demo.wathiqpay.com avec une carte de test SATIM, en français puis en arabe.

**Page de paiement**
- [x] Aucun paragraphe « démonstration » au-dessus du bouton de paiement.
- [x] Le bouton indique « Payer <montant> » et non « Tester ».
- [x] Le logo CIB / Edahabia est visible sur le bouton.
- [x] Conditions générales, case à cocher et Google reCAPTCHA toujours présents.
- [ ] Vérifié à la main dans un navigateur, en cochant le reCAPTCHA *(à faire par vous)*.

**Paiement accepté** (carte valide)
- [x] Le nom de l'entreprise « Maison Wathiq » apparaît en tête du reçu.
- [x] La ligne « Statut : Paiement accepté » apparaît.
- [x] Le libellé est « Identifiant de transaction », sans « SATIM ».
- [x] respCode_desc, numéro de commande, code d'autorisation, date et heure, montant, moyen de paiement et 3020 toujours présents.
- [ ] Reçu imprimable : nom de l'entreprise et statut présents *(à vérifier après un paiement réel)*.
- [ ] Reçu PDF téléchargé : nom de l'entreprise et statut présents *(à vérifier après un paiement réel)*.
- [ ] Reçu reçu par e-mail : statut présent dans le texte et dans le PDF joint *(à vérifier après un paiement réel)*.

**Paiement refusé** (par exemple carte « temporairement bloquée »)
- [x] Ni numéro de commande ni identifiant de transaction affichés.
- [x] Le motif du refus, le montant et le 3020 restent affichés.
- [ ] Vérifié aussi avec une annulation (« Annuler » sur la page SATIM) : titre « Paiement annulé », sans références *(à vérifier)*.

**Arabe et anglais**
- [ ] Mêmes vérifications avec la langue AR (reçu de droite à gauche) et EN *(à vérifier)*.

**Envoi à SATIM**
- [ ] Réponse envoyée avec les trois captures (`docs/satim-reponse-2026-09-24.md`).

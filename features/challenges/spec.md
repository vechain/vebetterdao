---
name: B3TR Challenges
overview: Feature challenges implementata con contratto upgradeable `B3TRChallenges`, upgrade `VeBetterPassport` V5 per contatori per-round, lambda schedulata `finalizeChallenges` e frontend `Challenges` collegato direttamente on-chain via `useQuery`, event logs e transazioni wallet.
todos:
  - id: design-contract-shape
    content: Definita API di `B3TRChallenges` con storage ERC-7201, enum/stati, eventi e read models
    status: completed
  - id: implement-challenge-logic
    content: Implementati create/join/leave/decline/addInvites/cancel con escrow B3TR per `Stake` e `Sponsored`
    status: completed
  - id: implement-batched-settlement
    content: Implementati `syncChallenge`, `finalizeChallengeBatch`, claim payout e refund pull-based
    status: completed
  - id: wire-deployment-config
    content: Integrato wiring di deploy, fixture, config e admin contract list per `B3TRChallenges`
    status: completed
  - id: add-tests-and-ci
    content: Aggiunti test contratti, round tracking Passport V5 e shard CI `shard9a` per `B3TRChallenges`
    status: completed
  - id: add-frontend-challenges
    content: Aggiunta sezione frontend `Challenges` con route/tab, detail page, banner inviti e action flow reali
    status: completed
  - id: add-finalize-challenges-lambda
    content: Aggiunta lambda schedulata `finalizeChallenges` con terraform, scheduler e workflow deploy
    status: completed
isProject: false
---

# B3TR Challenges

## Scope implementato

- Nuovo contratto upgradeable `B3TRChallenges.sol` con librerie `ChallengeCoreLogic`, `ChallengeSettlementLogic`, `ChallengeStorageTypes`, `ChallengeTypes` e interfaccia `IChallenges`.
- Upgrade `VeBetterPassport` a V5 con nuovi contatori per round usati dalla finalizzazione challenge.
- Nuova sezione frontend `Challenges` con route dedicate, tab, list/detail page, banner inviti, create flow e azioni utente.
- Nuova lambda schedulata `finalizeChallenges` con terraform e workflow di deploy dedicato.

## Contratti

- I tipi implementati sono `Stake` e `Sponsored`:
  - `Stake`: il creator deposita lo stake iniziale, viene aggiunto automaticamente ai partecipanti e ogni join aumenta `totalPrize`.
  - `Sponsored`: il creator finanzia il premio ma non partecipa.
- Le visibility implementate sono `Public` e `Private`.
- Gli stati implementati sono `Pending`, `Active`, `Finalizing`, `Finalized`, `Cancelled`, `Invalid`.
- I threshold mode implementati sono `None`, `SplitAboveThreshold`, `TopAboveThreshold`.
- Configurazioni applicate:
  - `startRound` deve essere > round corrente; `0` significa prossimo round.
  - durata massima challenge: `4` round.
  - massimo app selezionabili: `10`.
  - `appIds = []` significa `all apps`.
  - le challenge private possono essere joinate solo da wallet `invitationEligible`.
  - il creator puo' solo aggiungere inviti e cancellare finche' la challenge e' `Pending`.
- API/read models esposti:
  - `getChallenge`
  - `getChallengeStatus`
  - `getChallengeParticipants`
  - `getChallengeInvited`
  - `getChallengeDeclined`
  - `getChallengeSelectedApps`
  - `getParticipantStatus`
  - `isInvitationEligible`
  - `getParticipantActions`
- Lifecycle/actioni implementate:
  - `createChallenge`
  - `addInvites`
  - `joinChallenge`
  - `leaveChallenge`
  - `declineChallenge`
  - `cancelChallenge`
  - `syncChallenge`
- Un invitee puo' declinare e poi rientrare via `joinChallenge` finche' la challenge non parte.
- Eventi emessi:
  - `ChallengeCreated`
  - `ChallengeInviteAdded`
  - `ChallengeJoined`
  - `ChallengeLeft`
  - `ChallengeDeclined`
  - `ChallengeCancelled`
  - `ChallengeActivated`
  - `ChallengeInvalidated`
  - `ChallengeFinalizationAdvanced`
  - `ChallengeFinalized`
  - `ChallengePayoutClaimed`
  - `ChallengeRefundClaimed`
- Regola di validita' effettiva:
  - `Stake` richiede almeno `2` partecipanti totali, creator incluso.
  - `Sponsored` richiede almeno `1` partecipante.

## Settlement e payout

- La finalizzazione e' permissionless e batch-based via `finalizeChallengeBatch(challengeId, batchSize)`.
- Il cursore on-chain usato e' `nextFinalizeIndex`; lo stato passa `Active -> Finalizing -> Finalized`.
- Le actions sono lette da `VeBetterPassport`:
  - `userRoundActionCount()` quando la challenge copre tutte le app.
  - `userRoundActionCountApp()` quando la challenge ha una lista di app.
- Settlement mode implementati:
  - `TopWinners` per challenge senza threshold o `TopAboveThreshold` con almeno un qualificato.
  - `QualifiedSplit` per `SplitAboveThreshold` con almeno un qualificato.
  - `CreatorRefund` se in una `Sponsored` con threshold nessuno si qualifica.
- Payout e refund sono pull-based:
  - `claimChallengePayout`
  - `claimChallengeRefund`
- Refund effettivi:
  - challenge `Stake` cancellata o invalid: refund dello stake a ogni participant `Joined`.
  - challenge `Sponsored` cancellata o invalid: refund del premio al creator.
- Il calcolo payout assegna l'eventuale remainder all'ultimo claim, cosi' `totalPrize` viene distribuito interamente senza residui.

## VeBetterPassport V5

- La feature ha richiesto un upgrade `VeBetterPassport` V4 -> V5, non solo wiring lato challenge.
- Sono stati aggiunti e testati i contatori per round:
  - `userRoundActionCount`
  - `userRoundActionCountApp`
  - `userRoundAppCount`
  - `appRoundActionCount`
  - `registerActionForRound`
- Sono stati aggiunti:
  - contratto V4 deprecated per upgrade tests
  - script `vebetter-passport-v5.ts`
  - test dedicati `round-tracking.test.ts`
  - update degli upgrade tests e delle librerie Passport

## Frontend

- La sezione `Challenges` e' stata aggiunta in navbar, footer, metadata e admin contracts view.
- Le route implementate sono:
  - `/challenges` con redirect a `/challenges/all`
  - `/challenges/all`
  - `/challenges/mine`
  - `/challenges/invited`
  - `/challenges/public`
  - `/challenges/[challengeId]`
- Il frontend non usa mock statici: legge dati live on-chain con `useQuery`, `useThor`, multicall e filtri sugli eventi `ChallengeCreated`, `ChallengePayoutClaimed` e `ChallengeRefundClaimed`.
- Query/hooks implementati:
  - `useChallenges`
  - `useChallenge`
  - `useChallengeActions`
  - `useChallengeParticipantActions`
- UX implementata:
  - create stake challenge
  - create sponsored challenge
  - public/private visibility
  - selezione app oppure `all apps`
  - threshold configuration per sponsored challenge
  - accept/join, leave, decline, cancel, add invites, claim payout, claim refund, finalize
  - pending invitations banner
  - detail page con badge di stato, lista wallet, selected apps, invited wallets e leaderboard delle actions
- Lo stato delle CTA e' derivato client-side da status challenge, viewer status, invitation eligibility, claim/refund gia' eseguiti e saldo B3TR disponibile.
- Non c'e' dipendenza da indexer esterno in questa repo: liste e dettagli vengono ricostruiti da log + call on-chain.

## Lambda e infra

- E' stata aggiunta la lambda `packages/lambda/src/finalizeChallenges/lambda.ts`.
- La lambda:
  - legge il round corrente da `XAllocationVoting`
  - cerca le challenge con `endRound == currentRound - 1` filtrando `ChallengeCreated`
  - finalizza in loop con retry fino a `Finalized` o fino al cap `MAX_BATCHES_PER_CHALLENGE`
  - salta challenge `Cancelled`, `Invalid` o gia' `Finalized`
  - usa il distributor wallet gia' esistente
  - supporta `dryRun` e `batchSize` custom
  - invia notifiche Slack su successi e failure parziali
- Infra aggiunta:
  - terraform dedicato sotto `terraform/finalize-challenges`
  - scheduler EventBridge
  - workflow `.github/workflows/finalize-challenges-lambda-deploy.yml`
- Scheduling configurato:
  - dev/testnet: 10 minuti dopo `start-emissions-round`
  - prod/mainnet: 10 minuti dopo `start-emissions-round`
- Se `challengesContractAddress` e' `0x0`, la lambda esce in skip senza rompere il flusso.

## Integrazione repo

- Deploy e fixture allineati in `deployAll.ts` e `test/helpers/deploy.ts`.
- Aggiunto `challengesContractAddress` in `@repo/config` e nel generatore config locale.
- Aggiunto check deployment e visibilita' del contratto nella sezione admin.
- Gli indirizzi remote in `testnet`, `testnet-staging` e `mainnet` restano `0x0` finche' non viene fatto il deploy effettivo; il local wiring invece e' presente.

## Verifica

- Test contratti aggiunti in `packages/contracts/test/challenges/B3TRChallenges.test.ts` per:
  - create / join / leave / decline / cancel
  - validazione start/end round
  - invalid challenge e refund
  - settlement batch
  - tie split
  - sponsored con threshold su `all apps` e `selected apps`
- Test Passport round tracking aggiunti in `packages/contracts/test/vebetterpassport/round-tracking.test.ts`.
- Nuovo shard CI `shard9a` registrato in `.github/workflows/unit-tests.yml` e `packages/contracts/test/README.md`.
- Test lambda aggiunti in `packages/lambda/test/finalizeChallenges.test.ts` per skip config, no-ended-round case e dry-run base.
- In questo branch non e' stato aggiunto uno step CI dedicato per i test lambda nel workflow unitario principale.

import { GovernanceFeaturedFunction } from "@/constants"
import { abi } from "thor-devkit"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

const markdownDescriptionPlaceholder = `# Alterno et procul repletum

## Cum Arctonque paulatimque minor natum

Lorem markdownum omnia **arma alto** graves animos; nostri manu, quique certa
causas est, tetigisse! Animo sereno domus posse annosae custodia Pallade, Bacchi
est at est et tristis Vestaque: sua sunt Latona nullosque. Inter Coroniden
vincere quoque, in triplicesque nentes potenti iuvenis tortoque exiluit genitas?
Erit quae dei pressos domus, boum haec.

1. Utere time diu secura
2. Tanto annis colla verecundo cum sermo o
3. Erras tulit Hesperium amans hiems
4. Concitus illis fera artes saepe quarum longas

Iacta est tamen hospitibus inpia magni, remollescunt portus **iura tenuissima
cogitis** aliisque ad coniciunt tigride. Pia atras [enses
quo](http://www.liquerat.org/vetus-aegyptia) firmat in rapiunt Panes *fuerat*
fuerant [dicere](http://retinens-ramis.io/) Atrides famulosne et leto Alcathoen!
Fugere refecta hoc, exercent forma: aures venit, tutela aera aliter.

## A dracones mollit

Attollite pudorque totoque Cereris falcatus! Sic non undis, cui cinxisse densis,
domus, et plus placidos, nec nam Sidonide adspexit. Nec quos, una illo illa
praecluditur aurem saepe, captivo. Manet felicissima en et opus currere oris
sua, aut versa proxima natalibus manus intravimus *forma*. Toro ter formas
dicentem erant: defenderet qua vacuus quo vino postquam.

> Pendeat fulgentem *usque*. Latet *micabant adfectas alternaque* acumine quam
> properabat calorem; primus [liquidas incultos](http://ut.com/) in curvavit
> parantem avertit origine tollentes. Talia exilibus vituli.

## Medium tamen ipse paternam lumina perculit cultus

Vero digitis vertitur mirabile; facit rebus et sibi parte duo Othryn prospicit
quia, est murmure cognita, **ne**. Per pectore dolet lumen ait morem protervis
vetitae. Dant optandi scilicet, quid spectat, se sibi cruentae illum; non usum
Amenanus vident.

    win_x(469201 + matrixHardAdf);
    if (2 <= analyst) {
        autoresponderVirtual.sslSaasMirror -= quicktime_menu(requirements_text -
                balancing_compact_metadata, hotItunesDevice, heuristic +
                ofRamOn);
        cableRealMultiprocessing.bridgeUnicodeControl(clickDongleServer,
                zebibyteOpenProcess, alert.oem_drive(laserOnCommand));
        cell *= framework_drm_monochrome + terminal_exploit;
    }
    thread.device = ripcording.partition_tftp_xml(fsbOpticalPublic) -
            eExpansionMnemonic;
    if (pci(-4, domainResolution)) {
        mac.tiffTypeSeo += lun_real.rightLogic.spool(pageSectorBlob, pushWebIsp(
                4), printer_paper_e);
        fifoRepeaterSession.topology *= 56;
    }

Alcmene ceratis iam iussit contenta, prosecta anguesque tantae est idem.
Vertumnus manus secundo scitaris murram talaribus et axem nomenque videtur
vivaque? Capitis et quater undis sol dirimant mundi, rogati casam concutio
quoque inque causa [luminis](http://www.est-esse.net/pecoris), domus! Regione
heros titulum invidiosior omnia annua tempora *veterumque pudici quam*, cum
rerum. Et videre patruus libens et non imago, et *Scylla*.

[Consiliique loqui si](http://egit.org/condidit-et) latos. Extremo bacis opus
constiterant stabat praepositam Adoni tonso gurgite digitosque, ossa aufert fert
**recessu** nunc paviunt mundo! Cum aliquid **Persephone** sine avium, et lecto
Oedipodioniae *auris terrae agmine* vires avibus sospes frater. Macies parentis
recentem insomni inpiger incumbere postera movere remorata matres mixtaque
terras? Dedi perde putares eris.`

export type ProposalFormAction = GovernanceFeaturedFunction & {
  contractAddress: string
  calldata?: string
}
export type ProposalFormStoreState = {
  title?: string
  shortDescription?: string
  markdownDescription?: string
  actions: ProposalFormAction[]
  votingStartRoundId?: number
  depositAmount?: number
  setData: (data: Partial<ProposalFormStoreState>) => void
  clearData: () => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useProposalFormStore = create<ProposalFormStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        title: undefined,
        shortDescription: undefined,
        markdownDescription: markdownDescriptionPlaceholder,
        actions: [],
        votingStartRoundId: undefined,
        setData: (data: Partial<ProposalFormStoreState>) =>
          set(state => ({
            ...state,
            ...data,
          })),
        clearData: () =>
          set({
            title: undefined,
            shortDescription: undefined,
            markdownDescription: markdownDescriptionPlaceholder,
            actions: [],
            votingStartRoundId: undefined,
          }),
      }),
      {
        name: "PROPOSAL_FORM_STORE",
      },
    ),
  ),
)

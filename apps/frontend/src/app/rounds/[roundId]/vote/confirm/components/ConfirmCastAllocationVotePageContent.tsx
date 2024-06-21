type Props = {
  roundId: string
}

export const ConfirmCastAllocationVotePageContent = ({ roundId }: Readonly<Props>) => {
  // const { isOpen, onClose, onOpen } = useDisclosure()

  //   const castAllocationVotes = useCastAllocationVotes({ roundId })

  // const handleClose = useCallback(() => {
  //   castAllocationVotes.resetStatus()
  //   onClose()
  // }, [castAllocationVotes, onClose])
  // const onSubmit = useCallback(
  //     (data: CastAllocationVoteFormData) => {
  //       if (!votesAtSnapshot) throw new Error("Votes at snapshot not found")
  //       const appVotesPercentagesToValue: CastAllocationVotesProps = data.votes.map(vote => {
  //         const rawValue = scaledDivision(Number(vote.rawValue) * Number(votesAtSnapshot), 100)
  //         return {
  //           appId: vote.appId,
  //           votes: rawValue,
  //         }
  //       })

  //       onOpen()
  //       castAllocationVotes.sendTransaction(appVotesPercentagesToValue)
  //     },
  //     [castAllocationVotes, onOpen, votesAtSnapshot],
  //   )

  //   const onTryAgain = useCallback(() => {
  //     castAllocationVotes.resetStatus()
  //     handleSubmit(onSubmit)()
  //   }, [castAllocationVotes, handleSubmit, onSubmit])
  return (
    <>
      {/* <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={castAllocationVotes.error ? "error" : castAllocationVotes.status}
        confirmationTitle={"Confirm Vote"}
        successTitle={"Vote Cast!"}
        errorTitle={"Error casting vote"}
        errorDescription={castAllocationVotes.error?.reason}
        showSocialButtons
        socialDescriptionEncoded="%E2%9C%85%20Just%20cast%20my%20vote%20in%20the%20%23VeBetterDAO%20X%20allocation%20round%21%20%0A%0A%F0%9F%8C%B1%20Excited%20to%20be%20part%20of%20the%20decision-making%20process%20for%20sustainable%20projects.%0A%0AJoin%20us%20in%20shaping%20a%20greener%20future%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        onTryAgain={onTryAgain}
        showTryAgainButton
        showExplorerButton
        txId={castAllocationVotes.txReceipt?.meta.txID ?? castAllocationVotes.sendTransactionTx?.txid}
      /> */}
    </>
  )
}

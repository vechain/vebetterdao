import { useSteps, VStack } from "@chakra-ui/react"
import { StepModal } from "@/components/StepModal"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import Lottie from "react-lottie"
import UploadingMetadataAnimation from "./uploadingMetadata.json"
type Props = {
  isOpen: boolean
  onClose: () => void
}

enum UploadMetadataModalStep {
  UPLOADING = "UPLOADING",
}
export const UploadMetadataModal = ({ isOpen, onClose }: Props) => {
  const { activeStep, goToPrevious, goToNext, setActiveStep } = useSteps({
    index: 0,
    count: Object.keys(UploadMetadataModalStep).length,
  })
  const steps = [
    {
      key: UploadMetadataModalStep.UPLOADING,
      content: (
        <ModalAnimation>
          <VStack align={"center"} p={6}>
            <Lottie
              style={{
                pointerEvents: "none",
              }}
              options={{
                loop: true,
                autoplay: true,
                animationData: UploadingMetadataAnimation,
              }}
              height={200}
              width={200}
            />
          </VStack>
        </ModalAnimation>
      ),
      title: "Upload metadata",
      description: "Please wait while we upload the metadata",
    },
  ]
  return (
    <StepModal
      isOpen={isOpen}
      onClose={onClose}
      setActiveStep={setActiveStep}
      steps={steps}
      goToPrevious={goToPrevious}
      goToNext={goToNext}
      activeStep={activeStep}
    />
  )
}

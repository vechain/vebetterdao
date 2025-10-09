import { UilCheckCircle } from "@iconscout/react-unicons"
import { expect, test, describe } from "vitest"

import { render, screen } from "../../../test"
import { XAppStatus } from "../../types/appDetails"
import { NFTMediaType } from "../../types/media"

import Apps from "./page"

import { useXAppStatusConfig } from "@/app/apps/[appId]/hooks/useXAppStatusConfig"
import * as apiHooks from "@/api"
describe("Apps", () => {
  const defaultXNodeMock = {
    xNodeId: "1",
    xNodeName: "Node 1",
    nodeType: "XNODE",
    xNodeImage: "image",
    xNodeLevel: 1,
    xNodePoints: 100,
    endorsedApp: undefined,
    isEndorsingApp: false,
    xNodeOwner: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
    isXNodeHolder: true,
    isXNodeDelegator: false,
    isXNodeDelegated: false,
    isXNodeDelegatee: false,
    delegatee: undefined,
    attachedGMTokenId: undefined,
    attachedGMTokenName: "GM Token",
    isXNodeOnCooldown: false,
    isXNodeLoading: false,
  }
  const defaultAppEndorsementStatusMock = {
    threshold: "100",
    score: "100",
    status: XAppStatus.ENDORSED_AND_ELIGIBLE,
    isLoading: false,
  }
  const defaultXAppMetadataMock = {
    data: {
      logo: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
      name: "",
      description: "",
      external_url: "",
      banner: "",
      screenshots: [],
      social_urls: [],
      app_urls: [],
      tweets: [],
      ve_world: {
        banner: "",
        featured_image: "",
      },
    },
    isLoading: false,
    error: null,
  }

  const defaultIpfsImageMock = {
    data: {
      image: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
      mime: "image/png",
      mediaType: NFTMediaType.IMAGE,
    },
    isLoading: false,
    error: null,
  }

  const defaultXAppStatusConfigMock = {
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: {
      title: "Endorsed and active",
      description:
        "This app has enough score and will participate in the next allocation rounds, if not already included.",
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
  }

  const defaultCreatorSubmissionMock = {
    data: {
      submissions: [],
    },
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    //@ts-ignore
    vi.spyOn(apiHooks, "useXNode").mockReturnValue(defaultXNodeMock)
    //@ts-ignore
    vi.spyOn(apiHooks, "useAppEndorsementStatus").mockReturnValue(defaultAppEndorsementStatusMock)
    //@ts-ignore
    vi.spyOn(apiHooks, "useXAppMetadata").mockReturnValue(defaultXAppMetadataMock)
    //@ts-ignore
    vi.spyOn(apiHooks, "useIpfsImage").mockReturnValue(defaultIpfsImageMock)
    //@ts-ignore
    vi.spyOn(useXAppStatusConfig, "useXAppStatusConfig").mockReturnValue(defaultXAppStatusConfigMock)
    //@ts-ignore
    vi.spyOn(apiHooks, "useCreatorSubmission").mockReturnValue(defaultCreatorSubmissionMock)
  })

  test("XApps available - Renders correctly", async () => {
    const activeApps = [
      {
        id: "1",
        name: "Test Active App",
        teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
        createdAtTimestamp: "16347455",
        metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
        isNew: false,
      },
    ]

    const unendorsedApps = [
      {
        id: "2",
        name: "Test Unendorsed App",
        teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
        createdAtTimestamp: "0",
        metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
        isNew: false,
        appAvailableForAllocationVoting: false,
      },
    ]

    //@ts-ignore
    vi.spyOn(apiHooks, "useXApps").mockReturnValue({
      data: {
        active: activeApps,
        unendorsed: unendorsedApps,
        allApps: [...activeApps, ...unendorsedApps],
        endorsed: activeApps,
        newApps: [],
        gracePeriod: [],
        endorsementLost: [],
        newLookingForEndorsement: [],
        othersLookingForEndorsement: [],
      },
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(apiHooks, "useHasCreatorNFT").mockReturnValue(true)

    render(<Apps />)

    expect(await screen.findByTestId("apps-page")).toBeInTheDocument()
  })

  test("isLoading - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(apiHooks, "useXApps").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(apiHooks, "useHasCreatorNFT").mockReturnValue(false)

    render(<Apps />)

    expect(await screen.findByTestId("apps-page-loading")).toBeInTheDocument()
  })

  test("no dapps - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(apiHooks, "useXApps").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(apiHooks, "useHasCreatorNFT").mockReturnValue(false)

    render(<Apps />)

    expect(screen.queryByTestId("apps-page-loading")).not.toBeInTheDocument()
  })
})

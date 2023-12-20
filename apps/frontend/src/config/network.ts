import { getNetworkById } from "@repo/constants";

const nodeUrl = process.env.NEXT_PUBLIC_NODE_URL;
const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE;

const getNodeUrl = () => {
    if (!nodeUrl) {
        throw new Error("NEXT_PUBLIC_NODE_URL is not set");
    }
    return nodeUrl;
}
const getNetworkType = () => {
    if (!networkType) {
        throw new Error("NEXT_PUBLIC_NETWORK_TYPE is not set");
    }
    return networkType;
}

const getNetwork = () => {
    const network = getNetworkById(getNetworkType());
    if (!network) {
        throw new Error(`network associated with ${getNetworkType()} not found!`);
    }
    return network;
}


export const networkConfig = {
    nodeUrl: getNodeUrl(),
    network: getNetwork(),
}

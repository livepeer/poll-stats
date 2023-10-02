
export const catIpfsJson = async <T = any>(
  ipfsHash: string | undefined | null
): Promise<T | null> => {
  if (ipfsHash) {
    const fetchResult = await fetch(
      `https://ipfs.livepeer.com/ipfs/${ipfsHash}`,
      {
        method: "GET",
      }
    );
    const result = await fetchResult.json();

    return result as T;
  }

  return null;
};

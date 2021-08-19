export function getProtooUrl({ roomId, peerId })
{
	return `wss://v3demo.mediasoup.org:4443/?roomId=${roomId}&peerId=${peerId}`;
}

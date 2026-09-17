import { Text } from "@/i18n/text";
export default function Loading() {
  return (
    <div className="board-loading" role="status">
      <span className="loading-bar" />
      <Text id="loading_bounties" />
    </div>
  );
}

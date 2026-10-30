export default function PromptTitle({ text }: { text: string }) {
  return (
    <>
      <span aria-hidden="true">~/</span>
      {text}
      <span className="cursor" aria-hidden="true" />
    </>
  );
}

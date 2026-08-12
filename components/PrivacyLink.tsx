type PrivacyLinkProps = {
  className?: string;
};

function PrivacyLink({ className }: PrivacyLinkProps) {
  return (
    <a
      className={className}
      href={browser.runtime.getURL('/privacy.html')}
      target="_blank"
      rel="noreferrer"
    >
      Privacy policy
    </a>
  );
}

export default PrivacyLink;

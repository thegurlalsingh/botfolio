// JDoodleEmbed: embeds the JDoodle code editor via an external script and pym embed.
import { useEffect } from "react";

function JDoodleEmbed() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.jdoodle.com/assets/jdoodle-pym.min.js";
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<div data-pym-src="https://www.jdoodle.com/embed/v1/38fc58daf413fc6d"></div>`
      }}
    />
  );
}

export default JDoodleEmbed;

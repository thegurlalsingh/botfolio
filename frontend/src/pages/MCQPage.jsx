// MCQPage: renders the MCQ round component inside a full-screen dark container.
import MCQRound from '../components/mcq/MCQRound';

export default function MCQPage() {
  return (
    <div className="min-h-screen bg-[#0b0d13] text-gray-100 flex flex-col justify-center py-12">
      <div className="max-w-5xl mx-auto px-6 w-full">
        <MCQRound />
      </div>
    </div>
  );
}

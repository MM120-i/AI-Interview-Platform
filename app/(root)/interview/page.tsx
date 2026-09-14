import InterviewForm from "@/components/InterviewForm";

const InterviewPage = () => {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1>Create an interview</h1>
        <p>Choose the role and topics you want to practice</p>
      </div>

      <InterviewForm />
    </section>
  );
};

export default InterviewPage;

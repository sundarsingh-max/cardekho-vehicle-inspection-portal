{add && (
  <Modal
    title="Add Lead"
    close={() => setAdd(false)}
  >
    <div className="form">
      <p>
        Add Lead module will be connected to the
        Supabase cases table in the next step.
      </p>

      <button
        className="primary"
        onClick={() => setAdd(false)}
      >
        Close
      </button>
    </div>
  </Modal>
)}

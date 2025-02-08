export const determineBillLocation = (bill) => {
  if (!bill?.latestAction?.text) {
    return {
      track: "unknown",
      status: "unknown",
      details: "No action data available",
    };
  }

  const action = bill.latestAction.text.toLowerCase();
  const originChamber = bill.originChamberCode;
  const type = bill.type;

  // Helper function to determine if action is from a specific chamber
  const isFromChamber = (chamber) => {
    const keywords =
      chamber === "H"
        ? ["house", "speaker", "clerk of the house"]
        : ["senate", "secretary of the senate"];
    return keywords.some((keyword) => action.includes(keyword));
  };

  // Check for final stages first
  if (
    action.includes("became public law") ||
    action.includes("public law no")
  ) {
    return {
      track: "enacted",
      status: "law",
      details: "Bill has become law",
    };
  }

  if (action.includes("vetoed")) {
    return {
      track: "final",
      status: "vetoed",
      details: action.includes("override")
        ? "Veto override attempt"
        : "Vetoed by President",
    };
  }

  // Presidential stage
  if (action.includes("president")) {
    if (action.includes("signed")) {
      return {
        track: "final",
        status: "signed",
        details: "Signed by President",
      };
    }
    if (action.includes("presented to president")) {
      return {
        track: "final",
        status: "presented",
        details: "Awaiting President's action",
      };
    }
  }

  // Conference stage
  if (action.includes("conference")) {
    return {
      track: "conference",
      status: action.includes("report filed")
        ? "report_filed"
        : "in_conference",
      details: "In conference committee",
    };
  }

  // Resolving differences
  if (
    action.includes("resolving differences") ||
    action.includes("senate amendment") ||
    action.includes("house amendment")
  ) {
    return {
      track: "resolving",
      status: "amendments",
      details: "Chambers resolving differences",
    };
  }

  // Determine chamber-specific status
  const inOriginalChamber = isFromChamber(originChamber);
  const track = inOriginalChamber ? "house" : "senate"; //TODO this is wrong

  // Check for specific states within a chamber
  if (action.includes("referred to") || action.includes("committee")) {
    return {
      track,
      status: "committee",
      details: `In committee in ${inOriginalChamber ? "original" : "other"} chamber`,
    };
  }

  if (action.includes("discharge")) {
    return {
      track,
      status: "discharged",
      details: "Discharged from committee",
    };
  }

  if (action.includes("placed on calendar") || action.includes("calendar no")) {
    return {
      track,
      status: "calendar",
      details: "Placed on chamber calendar",
    };
  }

  if (
    action.includes("vote") ||
    action.includes("considered") ||
    action.includes("motion to proceed")
  ) {
    return {
      track,
      status: "floor",
      details: "Under floor consideration",
    };
  }

  if (action.includes("passed") || action.includes("agreed to")) {
    return {
      track,
      status: "passed",
      details: `Passed ${inOriginalChamber ? "original" : "other"} chamber`,
    };
  }

  // If no specific status is found but we know the chamber
  if (inOriginalChamber || isFromChamber(originChamber === "H" ? "S" : "H")) {
    return {
      track,
      status: "pending",
      details: `Pending in ${inOriginalChamber ? "original" : "other"} chamber`,
    };
  }

  // Default/fallback for introduced bills
  return {
    track: "introduced",
    status: "introduced",
    details: `Introduced in ${originChamber === "H" ? "House" : "Senate"}`,
  };
};

export const Dashboard = ({ bills = [] }) => {
  const tracks = {
    house: {
      title: "House of Representatives",
      columns: [
        { id: "introduced", title: "Introduced" },
        { id: "committee", title: "Committee" },
        { id: "floor", title: "Floor" },
      ],
    },
    senate: {
      title: "Senate",
      columns: [
        { id: "introduced", title: "Introduced" },
        { id: "committee", title: "Committee" },
        { id: "floor", title: "Floor" },
      ],
    },
    finalStages: {
      title: "Final Stages",
      columns: [
        { id: "conference", title: "Conference Committee" },
        { id: "president", title: "To President" },
        { id: "law", title: "Became Law" },
        { id: "failed", title: "Failed/Vetoed" },
      ],
    },
  };

  const groupBills = () => {
    const grouped = {
      house: { introduced: [], committee: [], floor: [] },
      senate: { introduced: [], committee: [], floor: [] },
      finalStages: { conference: [], president: [], law: [], failed: [] },
    };

    if (Array.isArray(bills)) {
      bills.forEach((bill) => {
        if (bill) {
          const { track, status } = determineBillLocation(bill);
          if (grouped[track] && grouped[track][status]) {
            grouped[track][status].push(bill);
          }
        }
      });
    }

    return grouped;
  };

  const groupedBills = groupBills();

  return (
    <div className="w-full bg-white">
      {Object.entries(tracks).map(([trackId, trackData]) => (
        <Track
          key={trackId}
          title={trackData.title}
          columns={trackData.columns}
          bills={groupedBills[trackId]}
        />
      ))}
    </div>
  );
};

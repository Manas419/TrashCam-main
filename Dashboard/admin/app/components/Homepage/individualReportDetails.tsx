import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  reportId?: string;
}

const IndividualReportDetails = ({ reportId }: Props) => {
  return (
    <div>
      <FontAwesomeIcon icon={faLocationDot} color="#62280B" />
      <Link
        href={reportId ? `/admin/details?id=${reportId}` : "/admin/details"}
        className="mx-2 px-2 text-xs font-semibold hover:underline justify-center"
      >
        Details
        <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
      </Link>
    </div>
  );
};

export default IndividualReportDetails;

import L from 'leaflet';


function clipSegment (a, b, bounds, useLastCode, round) {
	var codeA = useLastCode ? this._lastCode : L.LineUtil._getBitCode(a, bounds),
			codeB = L.LineUtil._getBitCode(b, bounds),
			codeOut, p, newCode;

	// save 2nd code to avoid calculating it on the next segment
	this._lastCode = codeB;

	while (true) {
		// if a,b is inside the clip window (trivial accept)
		if (!(codeA | codeB)) {
			return [a, b];
		// if a,b is outside the clip window (trivial reject)
		} else if (codeA & codeB) {
			return false;
		// other cases
		} else {
			codeOut = codeA || codeB;
			p = L.LineUtil._getEdgeIntersection(a, b, codeOut, bounds, round);
			newCode = L.LineUtil._getBitCode(p, bounds);

			if (codeOut === codeA) {
				p.z = a.z;
				a = p;
				codeA = newCode;
			} else {
				p.z = b.z;
				b = p;
				codeB = newCode;
			}
		}
	}
}


export default {
	clipSegment: clipSegment
};
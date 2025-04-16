import {
	Document,
	Paragraph,
	Table,
	TableRow,
	TableCell,
	TextRun,
	AlignmentType,
	BorderStyle,
	WidthType,
	HeadingLevel,
	PageOrientation,
	Header,
	Footer,
} from "docx";
import fs from "fs";

/**
 * Generates a DOCX file for a weekly report
 * @param {Object} report - The weekly report object
 * @returns {Buffer} - The generated DOCX file as a buffer
 */
export const generateWeeklyReportDocx = async (report) => {
	// Format dates
	const weekStartDate = new Date(report.weekStartDate).toLocaleDateString();
	const weekEndDate = new Date(report.weekEndDate).toLocaleDateString();
	const currentDate = new Date().toLocaleDateString();

	// Create header with title
	const header = new Header({
		children: [
			new Paragraph({
				text: "WEEKLY REPORT",
				heading: HeadingLevel.HEADING_1,
				alignment: AlignmentType.CENTER,
				thematicBreak: true,
			}),
		],
	});

	// Create document sections
	const sections = [
		// Report metadata section
		new Paragraph({
			text: "WEEKLY REPORT DETAILS",
			heading: HeadingLevel.HEADING_2,
			spacing: { before: 400, after: 200 },
		}),

		// Student info table
		new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: {
				top: { style: BorderStyle.SINGLE, size: 1 },
				bottom: { style: BorderStyle.SINGLE, size: 1 },
				left: { style: BorderStyle.SINGLE, size: 1 },
				right: { style: BorderStyle.SINGLE, size: 1 },
				insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
				insideVertical: { style: BorderStyle.SINGLE, size: 1 },
			},
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph("Student Name:")],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 70, type: WidthType.PERCENTAGE },
							children: [new Paragraph(report.studentName)],
						}),
					],
				}),
				new TableRow({
					children: [
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph("Internship Site:")],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 70, type: WidthType.PERCENTAGE },
							children: [new Paragraph(report.internshipSite)],
						}),
					],
				}),
				new TableRow({
					children: [
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph("Week Period:")],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 70, type: WidthType.PERCENTAGE },
							children: [new Paragraph(`${weekStartDate} - ${weekEndDate}`)],
						}),
					],
				}),
				new TableRow({
					children: [
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph("Status:")],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 70, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph(
									report.status.charAt(0).toUpperCase() + report.status.slice(1)
								),
							],
						}),
					],
				}),
				new TableRow({
					children: [
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph("Supervisor Name:")],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 70, type: WidthType.PERCENTAGE },
							children: [new Paragraph(report.supervisorName)],
						}),
					],
				}),
			],
		}),

		// Daily records section
		new Paragraph({
			text: "DAILY RECORDS",
			heading: HeadingLevel.HEADING_2,
			spacing: { before: 400, after: 200 },
		}),
	];

	// Add daily records
	const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

	for (let i = 0; i < days.length; i++) {
		const day = days[i];
		const dailyRecord =
			report.dailyRecords && report.dailyRecords[i]
				? report.dailyRecords[i]
				: {
						timeIn: { morning: "N/A", afternoon: "N/A" },
						timeOut: { morning: "N/A", afternoon: "N/A" },
						accomplishments: "No records for this day",
				  };

		sections.push(
			new Paragraph({
				text: day,
				heading: HeadingLevel.HEADING_3,
				spacing: { before: 200, after: 100 },
			}),

			new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				borders: {
					top: { style: BorderStyle.SINGLE, size: 1 },
					bottom: { style: BorderStyle.SINGLE, size: 1 },
					left: { style: BorderStyle.SINGLE, size: 1 },
					right: { style: BorderStyle.SINGLE, size: 1 },
					insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
					insideVertical: { style: BorderStyle.SINGLE, size: 1 },
				},
				rows: [
					new TableRow({
						children: [
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph({ text: "Time Period", bold: true })],
								shading: { fill: "F2F2F2" },
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph({ text: "Time In", bold: true })],
								shading: { fill: "F2F2F2" },
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph({ text: "Time Out", bold: true })],
								shading: { fill: "F2F2F2" },
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph({ text: "Hours", bold: true })],
								shading: { fill: "F2F2F2" },
							}),
						],
					}),
					new TableRow({
						children: [
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph("Morning")],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph(dailyRecord.timeIn.morning)],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph(dailyRecord.timeOut.morning)],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph("")],
							}),
						],
					}),
					new TableRow({
						children: [
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph("Afternoon")],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph(dailyRecord.timeIn.afternoon)],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph(dailyRecord.timeOut.afternoon)],
							}),
							new TableCell({
								width: { size: 25, type: WidthType.PERCENTAGE },
								children: [new Paragraph("")],
							}),
						],
					}),
				],
			}),

			new Paragraph({
				text: "Accomplishments:",
				spacing: { before: 100, after: 100 },
				bold: true,
			}),

			new Paragraph({
				text: dailyRecord.accomplishments || "No accomplishments recorded",
				spacing: { after: 200 },
			})
		);
	}

	// Add certification section
	sections.push(
		new Paragraph({
			text: "CERTIFICATION",
			heading: HeadingLevel.HEADING_2,
			spacing: { before: 400, after: 200 },
		}),

		new Paragraph({
			text: '"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."',
			spacing: { before: 100, after: 300 },
			italics: true,
		}),

		// Signature table
		new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: {
				top: { style: BorderStyle.NONE },
				bottom: { style: BorderStyle.NONE },
				left: { style: BorderStyle.NONE },
				right: { style: BorderStyle.NONE },
				insideHorizontal: { style: BorderStyle.NONE },
				insideVertical: { style: BorderStyle.NONE },
			},
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 50, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									text: "_______________________________",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: report.supervisorName,
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: "Company Supervisor's Signature",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: `Date: ${currentDate}`,
									alignment: AlignmentType.CENTER,
								}),
							],
							borders: {
								top: { style: BorderStyle.NONE },
								bottom: { style: BorderStyle.NONE },
								left: { style: BorderStyle.NONE },
								right: { style: BorderStyle.NONE },
							},
						}),
						new TableCell({
							width: { size: 50, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									text: "_______________________________",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: report.studentName,
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: "Student Intern's Signature",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: `Date: ${currentDate}`,
									alignment: AlignmentType.CENTER,
								}),
							],
							borders: {
								top: { style: BorderStyle.NONE },
								bottom: { style: BorderStyle.NONE },
								left: { style: BorderStyle.NONE },
								right: { style: BorderStyle.NONE },
							},
						}),
					],
				}),
			],
		})
	);

	// Add admin comments if they exist
	if (report.adminComments) {
		sections.push(
			new Paragraph({
				text: "ADMIN COMMENTS",
				heading: HeadingLevel.HEADING_2,
				spacing: { before: 400, after: 200 },
			}),

			new Paragraph({
				text: report.adminComments,
				spacing: { before: 100, after: 200 },
			})
		);
	}

	// Create the document
	const doc = new Document({
		sections: [
			{
				properties: {
					page: {
						margin: {
							top: 1000,
							right: 1000,
							bottom: 1000,
							left: 1000,
						},
					},
				},
				headers: {
					default: header,
				},
				children: sections,
			},
		],
	});

	// In the docx library, Packer is used to create the actual file
	const Packer = await import("docx").then((module) => module.Packer);
	return await Packer.toBuffer(doc);
};

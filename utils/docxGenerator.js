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
	ImageRun,
	Underline,
} from "docx";
import fs from "fs";
import path from "path";

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

	// Get the header image
	const headerImagePath = path.join(
		process.cwd(),
		"public/image/bcbd4d01-2683-4fe9-85a6-e65ab090b01d.jpeg"
	);
	const headerImageData = fs.readFileSync(headerImagePath);

	// Create header with image
	const header = new Header({
		children: [
			new Paragraph({
				children: [
					new ImageRun({
						data: headerImageData,
						transformation: {
							width: 600,
							height: 100,
						},
					}),
				],
				alignment: AlignmentType.CENTER,
				spacing: { after: 200 },
			}),
		],
	});

	// Create document sections with more compact layout
	const sections = [
		// Student info table - more compact
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

		// Daily records section - more compact
		new Paragraph({
			text: "DAILY RECORDS",
			heading: HeadingLevel.HEADING_3,
			spacing: { before: 200, after: 100 },
		}),
	];

	// Add daily records in a more compact format
	const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

	// Create a single table for all days to save space
	const dailyRecordsRows = [];

	// Add header row
	dailyRecordsRows.push(
		new TableRow({
			children: [
				new TableCell({
					width: { size: 15, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Day", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
				new TableCell({
					width: { size: 15, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Morning In", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
				new TableCell({
					width: { size: 15, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Morning Out", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
				new TableCell({
					width: { size: 15, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Afternoon In", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
				new TableCell({
					width: { size: 15, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Afternoon Out", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
				new TableCell({
					width: { size: 25, type: WidthType.PERCENTAGE },
					children: [new Paragraph({ text: "Accomplishments", bold: true })],
					shading: { fill: "F2F2F2" },
				}),
			],
		})
	);

	// Add a row for each day
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

		dailyRecordsRows.push(
			new TableRow({
				children: [
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(day)],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(dailyRecord.timeIn.morning)],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(dailyRecord.timeOut.morning)],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(dailyRecord.timeIn.afternoon)],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(dailyRecord.timeOut.afternoon)],
					}),
					new TableCell({
						width: { size: 25, type: WidthType.PERCENTAGE },
						children: [
							new Paragraph(
								dailyRecord.accomplishments || "No accomplishments recorded"
							),
						],
					}),
				],
			})
		);
	}

	// Add the daily records table
	sections.push(
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
			rows: dailyRecordsRows,
		})
	);

	// Add certification section
	sections.push(
		new Paragraph({
			text: "CERTIFICATION",
			heading: HeadingLevel.HEADING_3,
			spacing: { before: 200, after: 100 },
		}),

		new Paragraph({
			text: '"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."',
			spacing: { before: 50, after: 150 },
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

	// Create the document with smaller margins to fit on one page
	const doc = new Document({
		sections: [
			{
				properties: {
					page: {
						margin: {
							top: 600, // Reduced top margin to accommodate header
							right: 600, // Reduced side margins
							bottom: 600, // Reduced bottom margin
							left: 600, // Reduced side margins
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

/**
 * Generates a DOCX file for a Daily Attendance and Accomplishment Form
 * @param {Object} data - The data for the form
 * @returns {Buffer} - The generated DOCX file as a buffer
 */
export const generateDailyAttendanceForm = async (data) => {
	// Format dates
	const beginDate = data.beginDate ? new Date(data.beginDate).toLocaleDateString() : "______________";
	const endDate = data.endDate ? new Date(data.endDate).toLocaleDateString() : "______________";
	const currentDate = new Date().toLocaleDateString();
	
	// Get the header image
	const headerImagePath = path.join(process.cwd(), "public/image/bcbd4d01-2683-4fe9-85a6-e65ab090b01d.jpeg");
	const headerImageData = fs.readFileSync(headerImagePath);
	
	// Create document sections
	const sections = [];
	
	// Header with logo and title
	sections.push(
		// Logo
		new Paragraph({
			children: [
				new ImageRun({
					data: headerImageData,
					transformation: {
						width: 600,
						height: 100,
					},
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 200 },
		}),
		
		// Title
		new Paragraph({
			children: [
				new TextRun({
					text: "COLLEGE OF INFORMATION TECHNOLOGY",
					bold: true,
					size: 28,
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 120 },
		}),
		
		// Subtitle
		new Paragraph({
			children: [
				new TextRun({
					text: "DAILY ATTENDANCE AND ACCOMPLISHMENT FORM",
					size: 24,
					underline: {
						type: Underline.SINGLE,
					},
				}),
			],
			alignment: AlignmentType.CENTER,
			spacing: { after: 400 },
		})
	);
	
	// Student Details Section - using a table for layout
	sections.push(
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
						// Left column
						new TableCell({
							width: { size: 50, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: "Student Name: ",
											bold: true,
										}),
										new TextRun({
											text: data.studentName || "DON ALJHON B. SALVADOR",
										}),
									],
									spacing: { after: 200 },
								}),
								new Paragraph({
									children: [
										new TextRun({
											text: "For the Period: ",
											bold: true,
										}),
										new TextRun({
											text: beginDate,
										}),
									],
								}),
							],
							borders: {
								top: { style: BorderStyle.NONE },
								bottom: { style: BorderStyle.NONE },
								left: { style: BorderStyle.NONE },
								right: { style: BorderStyle.NONE },
							},
						}),
						// Right column
						new TableCell({
							width: { size: 50, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: "Internship Site: ",
											bold: true,
										}),
										new TextRun({
											text: data.internshipSite || "Aljay Agro-Industrial Solutions, Inc.",
										}),
									],
									spacing: { after: 200 },
								}),
								new Paragraph({
									children: [
										new TextRun({
											text: "To: ",
											bold: true,
										}),
										new TextRun({
											text: endDate,
										}),
									],
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
	
	// Attendance Table
	sections.push(
		new Paragraph({
			spacing: { before: 400, after: 200 },
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
				// Header row
				new TableRow({
					children: [
						new TableCell({
							width: { size: 15, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Date", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 15, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Morning IN/OUT", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 15, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Afternoon IN/OUT", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 30, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Accomplishment/s", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 10, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Total Hours", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
						new TableCell({
							width: { size: 15, type: WidthType.PERCENTAGE },
							children: [new Paragraph({ text: "Verified by", bold: true })],
							shading: { fill: "F2F2F2" },
						}),
					],
				}),
			],
		})
	);
	
	// Add empty rows for each day
	const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
	const attendanceTable = sections[sections.length - 1];
	
	days.forEach(day => {
		attendanceTable.rows.push(
			new TableRow({
				children: [
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph(day)],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph("_____ / _____")],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph("_____ / _____")],
					}),
					new TableCell({
						width: { size: 30, type: WidthType.PERCENTAGE },
						children: [new Paragraph("")],
					}),
					new TableCell({
						width: { size: 10, type: WidthType.PERCENTAGE },
						children: [new Paragraph("")],
					}),
					new TableCell({
						width: { size: 15, type: WidthType.PERCENTAGE },
						children: [new Paragraph("")],
					}),
				],
				height: { value: 400 },
			})
		);
	});
	
	// Certification Section
	sections.push(
		new Paragraph({
			spacing: { before: 400, after: 200 },
		}),
		
		new Paragraph({
			text: '"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."',
			spacing: { before: 100, after: 300 },
			italics: true,
			alignment: AlignmentType.CENTER,
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
									text: data.supervisorName || "Company Supervisor",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: "Company Supervisor's Signature",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: `Date: ${endDate}`,
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
									text: data.studentName || "DON ALJHON B. SALVADOR",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: "Student Intern's Signature",
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									text: `Date: ${endDate}`,
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
	
	// Create the document
	const doc = new Document({
		sections: [
			{
				properties: {
					page: {
						margin: {
							top: 600,
							right: 600,
							bottom: 600,
							left: 600,
						},
					},
				},
				children: sections,
			},
		],
	});
	
	// In the docx library, Packer is used to create the actual file
	const Packer = await import("docx").then((module) => module.Packer);
	return await Packer.toBuffer(doc);
};

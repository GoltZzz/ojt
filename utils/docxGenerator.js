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
	ImageRun,
	Underline,
	ShadingType,
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

	// Create document sections to match the show page layout
	const sections = [
		// Header image
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

		// Report header section with title and styling to match CSS
		new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: {
				top: { style: BorderStyle.SINGLE, size: 1 },
				bottom: { style: BorderStyle.SINGLE, size: 1 },
				left: { style: BorderStyle.SINGLE, size: 1 },
				right: { style: BorderStyle.SINGLE, size: 1 },
			},
			shading: { fill: "FFFFFF" }, // White background
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 100, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: "Weekly Report Details",
											size: 32,
											bold: true,
											color: "2193b0", // From CSS .report-header h1 color
										}),
									],
									spacing: { after: 200 },
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
		}),

		// Student info section with styled borders
		new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: {
				top: { style: BorderStyle.SINGLE, size: 1 },
				bottom: { style: BorderStyle.SINGLE, size: 1 },
				left: { style: BorderStyle.SINGLE, size: 1 },
				right: { style: BorderStyle.SINGLE, size: 1 },
			},
			shading: { fill: "FFFFFF" }, // White background
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 100, type: WidthType.PERCENTAGE },
							children: [
								// Student Name
								new Paragraph({
									children: [
										new TextRun({
											text: "Student Name: ",
											bold: true,
											color: "495057", // From CSS .report-info .label color
										}),
										new TextRun({
											text: report.studentName,
											color: "2193b0", // From CSS .report-info .value color
										}),
									],
									spacing: { after: 120 },
								}),
								
								// Internship Site
								new Paragraph({
									children: [
										new TextRun({
											text: "Internship Site: ",
											bold: true,
											color: "495057", // From CSS .report-info .label color
										}),
										new TextRun({
											text: report.internshipSite,
											color: "2193b0", // From CSS .report-info .value color
										}),
									],
									spacing: { after: 120 },
								}),
								
								// Week Period
								new Paragraph({
									children: [
										new TextRun({
											text: "Week Period: ",
											bold: true,
											color: "495057", // From CSS .report-info .label color
										}),
										new TextRun({
											text: `${weekStartDate} - ${weekEndDate}`,
											color: "2193b0", // From CSS .report-info .value color
										}),
									],
									spacing: { after: 120 },
								}),
								
								// Supervisor Name
								new Paragraph({
									children: [
										new TextRun({
											text: "Supervisor Name: ",
											bold: true,
											color: "495057", // From CSS .report-info .label color
										}),
										new TextRun({
											text: report.supervisorName,
											color: "2193b0", // From CSS .report-info .value color
										}),
									],
									spacing: { after: 120 },
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
		}),

		// Daily records section header
		new Paragraph({
			children: [
				new TextRun({
					text: "Daily Records",
					size: 28,
					bold: true,
					color: "2193b0", // Match the header color
				}),
			],
			spacing: { before: 300, after: 200 },
			alignment: AlignmentType.CENTER,
		}),
	];

	// Add daily records in a card-like format similar to the show page
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

		// Day card
		sections.push(
			new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				borders: {
					top: { style: BorderStyle.SINGLE, size: 1 },
					bottom: { style: BorderStyle.SINGLE, size: 1 },
					left: { style: BorderStyle.SINGLE, size: 1 },
					right: { style: BorderStyle.SINGLE, size: 1 },
				},
				rows: [
					// Card header with gradient-like styling
					new TableRow({
						children: [
							new TableCell({
								width: { size: 100, type: WidthType.PERCENTAGE },
								children: [
									new Paragraph({
										children: [
											new TextRun({
												text: day,
												bold: true,
												color: "FFFFFF", // White text
												size: 24,
											}),
										],
									}),
								],
								shading: { fill: "2193b0" }, // Match the card-header background
								borders: {
									top: { style: BorderStyle.NONE },
									bottom: { style: BorderStyle.NONE },
									left: { style: BorderStyle.NONE },
									right: { style: BorderStyle.NONE },
								},
							}),
						],
					}),
					// Card body
					new TableRow({
						children: [
							new TableCell({
								width: { size: 100, type: WidthType.PERCENTAGE },
								children: [
									// Time records section
									new Paragraph({
										children: [
											new TextRun({
												text: "Morning",
												bold: true,
												color: "495057", // From CSS .time-block h6 color
											}),
										],
										spacing: { after: 80 },
									}),
									new Paragraph({
										children: [
											new TextRun({
												text: `In: ${dailyRecord.timeIn.morning}    Out: ${dailyRecord.timeOut.morning}`,
												color: "6c757d", // From CSS .time-detail color
											}),
										],
										spacing: { after: 120 },
									}),
									new Paragraph({
										children: [
											new TextRun({
												text: "Afternoon",
												bold: true,
												color: "495057", // From CSS .time-block h6 color
											}),
										],
										spacing: { after: 80 },
									}),
									new Paragraph({
										children: [
											new TextRun({
												text: `In: ${dailyRecord.timeIn.afternoon}    Out: ${dailyRecord.timeOut.afternoon}`,
												color: "6c757d", // From CSS .time-detail color
											}),
										],
										spacing: { after: 120 },
									}),
									
									// Accomplishments section with border
									new Paragraph({
										text: "",
										border: {
											top: {
												color: "dee2e6", // From CSS .accomplishments border-top
												style: BorderStyle.SINGLE,
												size: 1,
											},
										},
										spacing: { before: 80, after: 80 },
									}),
									new Paragraph({
										children: [
											new TextRun({
												text: "Accomplishments:",
												bold: true,
												color: "495057", // From CSS .accomplishments h6 color
											}),
										],
										spacing: { after: 80 },
									}),
									new Paragraph({
										text: dailyRecord.accomplishments || "No accomplishments recorded",
										spacing: { after: 120 },
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
		
		// Add spacing between cards
		sections.push(
			new Paragraph({
				text: "",
				spacing: { before: 120, after: 120 },
			})
		);
	}

	// Add certification section with styling to match CSS
	sections.push(
		new Table({
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: {
				top: { style: BorderStyle.SINGLE, size: 1 },
				bottom: { style: BorderStyle.SINGLE, size: 1 },
				left: { style: BorderStyle.SINGLE, size: 1 },
				right: { style: BorderStyle.SINGLE, size: 1 },
			},
			shading: { fill: "F8F9FA" }, // From CSS .certification-section background
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 100, type: WidthType.PERCENTAGE },
							children: [
								new Paragraph({
									children: [
										new TextRun({
											text: "CERTIFICATION",
											bold: true,
											size: 28,
											color: "2193b0", // Match the header color
										}),
									],
									spacing: { before: 120, after: 120 },
									alignment: AlignmentType.CENTER,
								}),
								new Paragraph({
									children: [
										new TextRun({
											text: '"I CERTIFY on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival at and departure from office."',
											italics: true,
											color: "495057", // From CSS .certification-text color
										}),
									],
									spacing: { before: 80, after: 200 },
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
												// Supervisor signature
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: "_______________________________",
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: report.supervisorName,
																	bold: true, // From CSS .signature-name font-weight
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: "Company Supervisor's Signature",
																	color: "6c757d", // From CSS .signature-title color
																	size: 18, // Smaller font size
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: `Date: ${currentDate}`,
																	color: "6c757d", // From CSS .signature-date color
																	size: 18, // Smaller font size
																}),
															],
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
												
												// Student signature
												new TableCell({
													width: { size: 50, type: WidthType.PERCENTAGE },
													children: [
														new Paragraph({
															text: "_______________________________",
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: report.studentName,
																	bold: true, // From CSS .signature-name font-weight
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: "Student Intern's Signature",
																	color: "6c757d", // From CSS .signature-title color
																	size: 18, // Smaller font size
																}),
															],
															alignment: AlignmentType.CENTER,
														}),
														new Paragraph({
															children: [
																new TextRun({
																	text: `Date: ${currentDate}`,
																	color: "6c757d", // From CSS .signature-date color
																	size: 18, // Smaller font size
																}),
															],
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
				text: "",
				spacing: { before: 200, after: 80 },
			}),
			new Table({
				width: { size: 100, type: WidthType.PERCENTAGE },
				borders: {
					top: { style: BorderStyle.SINGLE, size: 1 },
					bottom: { style: BorderStyle.SINGLE, size: 1 },
					left: { style: BorderStyle.SINGLE, size: 1 },
					right: { style: BorderStyle.SINGLE, size: 1 },
				},
				rows: [
					new TableRow({
						children: [
							new TableCell({
								width: { size: 100, type: WidthType.PERCENTAGE },
								children: [
									new Paragraph({
										children: [
											new TextRun({
												text: "ADMIN COMMENTS",
												bold: true,
												size: 24,
												color: "2193b0", // From CSS .admin-comments h4 color
											}),
										],
										spacing: { before: 120, after: 120 },
									}),
									new Paragraph({
										text: report.adminComments,
										spacing: { before: 80, after: 120 },
									}),
								],
								borders: {
									top: { style: BorderStyle.NONE },
									bottom: { style: BorderStyle.NONE },
									left: { style: BorderStyle.NONE },
									right: { style: BorderStyle.NONE },
								},
								shading: { fill: "F8F9FA" }, // From CSS .comment-box background-color
							}),
						],
					}),
				],
			})
		);
	}

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

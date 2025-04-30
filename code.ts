figma.showUI(__html__, { width: 340, height: 620 });

async function main() {
  // Start the loading state
  figma.ui.postMessage({ type: "loading", status: true });

  try {
    // Perform the font loading
    await loadFonts();
    console.log("loaded fonts!");
    // Post-loading actions
    // ...
  } catch (error) {
    console.error("Error loading fonts:", error);
    figma.ui.postMessage({ type: "error", message: "Failed to load fonts." });
  } finally {
    // End the loading state
    figma.ui.postMessage({ type: "loading", status: false });
  }
}

main();

figma.ui.onmessage = (msg) => {
  if (figma.currentPage.selection.length < 1) {
    figma.notify("Please select a calendar :)");
  } else {
    if (msg.type === "create-calendar") {
      updateCalendar(msg.month, msg.year, msg.weekStart);
    }
  }
};

const fallbackFonts = [
  { family: "Roboto", style: "Regular" },
  { family: "Arial", style: "Regular" },
];

async function loadFonts() {
  const textNodes = figma.currentPage.findAll(
    (node) => node.type === "TEXT"
  ) as TextNode[];

  for (const textNode of textNodes) {
    const fontName = textNode.fontName;

    if (fontName !== figma.mixed) {
      try {
        await figma.loadFontAsync(fontName);
      } catch (error) {
        console.error("Error loading font:", fontName, "; Error:", error);
        // Try loading fallback fonts
        for (const fallbackFont of fallbackFonts) {
          try {
            await figma.loadFontAsync(fallbackFont);
            console.log(`Fallback font loaded: ${fallbackFont.family}`);
            break; // Exit loop once a fallback font is loaded
          } catch (fallbackError) {
            console.error(
              "Error loading fallback font:",
              fallbackFont,
              "; Error:",
              fallbackError
            );
          }
        }
      }
    }
  }
}

function updateCalendar(month: number, year: number, weekStart: number) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek =
    (new Date(year, month - 1, 1).getDay() - weekStart + 7) % 7;

  const headerNode = (figma.currentPage.selection[0] as FrameNode).findAll(
    (node: any) => node.type === "TEXT" && node.name === "Month YYYY"
  ) as TextNode[];

  if (headerNode.length > 0) {
    headerNode[0].characters = `${monthNames[month - 1]} ${year}`;
  }

  const textNodes = (figma.currentPage.selection[0] as FrameNode).findAll(
    (node: any) =>
      node.type === "TEXT" &&
      node.parent &&
      node.parent.name === ".calendar-day"
  ) as TextNode[];
  if (textNodes.length < 1) {
    figma.notify("Can't find any layers named '.calendar-day' :(");
    return;
  }

  const monthButton = (figma.currentPage.selection[0] as FrameNode).findAll(
    (node: any) =>
      node.name === "MONTH_BUTTON" &&
      node.parent &&
      node.parent.name === "MONTH_SELECTOR"
  ) as InstanceNode[];
  if (monthButton.length < 1) {
    figma.notify("Can't find any layers named 'MONTH_BUTTON_V2' :(");
    return;
  }
  monthButton.forEach((button, index) => {
    button.setProperties({
      SELECTED: index % 12 === month - 1 ? "TRUE" : "FALSE",
    });
  });

  console.log(monthButton.length);
  console.log(month);

  const dayNameNodes = (figma.currentPage.selection[0] as FrameNode).findAll(
    (node: any) =>
      node.type === "TEXT" &&
      node.parent &&
      node.parent.name === ".calendar-day-name"
  ) as TextNode[];
  if (dayNameNodes.length < 1) {
    //figma.notify("Can't find any layers named '.calendar-day-name' :(");
  }

  textNodes.forEach((textNode: TextNode, index: number) => {
    const date = new Date(year, month - 1, index - firstDayOfWeek + 1);
    textNode.characters = `${date.getDate()}`;
    if (dayNameNodes[index]) {
      dayNameNodes[index].characters = getDayName(date.getDay());
    }
  });

  figma.notify("Updated calendar");
}

function getDayName(dayIndex: number) {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[dayIndex];
}

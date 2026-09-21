export function getLocationFromDocument(doc: Document): Pick<Location, "href" | "pathname"> {
  if (doc.defaultView?.location?.href) {
    return doc.defaultView.location;
  }
  return doc.location;
}

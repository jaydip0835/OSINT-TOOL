import hashlib
import io

from fastapi import APIRouter, UploadFile, File
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

router = APIRouter(prefix="/api/metadata", tags=["Metadata Analyzer"])


def _dms_to_decimal(dms, ref):
    """Convert EXIF GPS (degrees, minutes, seconds) to decimal degrees."""
    try:
        degrees, minutes, seconds = dms
        decimal = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
        if ref in ("S", "W"):
            decimal = -decimal
        return round(decimal, 6)
    except Exception:
        return None


def _extract_gps(gps_info: dict):
    labeled = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}
    lat = labeled.get("GPSLatitude")
    lat_ref = labeled.get("GPSLatitudeRef")
    lon = labeled.get("GPSLongitude")
    lon_ref = labeled.get("GPSLongitudeRef")

    if not (lat and lon and lat_ref and lon_ref):
        return None

    latitude = _dms_to_decimal(lat, lat_ref)
    longitude = _dms_to_decimal(lon, lon_ref)
    if latitude is None or longitude is None:
        return None

    gps = {
        "latitude": latitude,
        "longitude": longitude,
        "maps_url": f"https://www.google.com/maps?q={latitude},{longitude}",
    }
    if "GPSAltitude" in labeled:
        try:
            gps["altitude_m"] = round(float(labeled["GPSAltitude"]), 1)
        except Exception:
            pass
    return gps


@router.post("/image")
async def analyze_image(file: UploadFile = File(...)):
    result = {}
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        result["filename"] = file.filename
        result["format"] = image.format
        result["mode"] = image.mode
        result["size"] = {"width": image.size[0], "height": image.size[1]}
        result["file_size_bytes"] = len(contents)
        result["hashes"] = {
            "md5": hashlib.md5(contents).hexdigest(),
            "sha256": hashlib.sha256(contents).hexdigest(),
        }

        # EXIF Data (use the modern getexif() API — works across formats)
        exif_data = {}
        gps_coordinates = None
        try:
            exif = image.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if tag == "GPSInfo":
                        try:
                            gps_coordinates = _extract_gps(value)
                        except Exception:
                            pass
                        continue
                    try:
                        exif_data[str(tag)] = str(value)
                    except Exception:
                        pass
        except Exception:
            pass

        result["exif"] = exif_data if exif_data else {"info": "No EXIF data found"}
        result["gps_location"] = gps_coordinates or {"info": "No embedded GPS coordinates found"}

    except Exception as e:
        result["error"] = str(e)

    return {"type": "image", "data": result}

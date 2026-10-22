from fastapi import APIRouter

router = APIRouter(prefix="/api/dork", tags=["Google Dork Generator"])

@router.get("/{target}")
def generate_dorks(target: str):
    dorks = {
        "site_search": [
            f"site:{target}",
            f"site:{target} filetype:pdf",
            f"site:{target} filetype:xls OR filetype:xlsx",
            f"site:{target} filetype:doc OR filetype:docx",
            f"site:{target} intitle:index.of",
            f"site:{target} inurl:admin",
            f"site:{target} inurl:login",
            f"site:{target} inurl:config",
            f"site:{target} inurl:backup",
            f"site:{target} inurl:upload",
        ],
        "sensitive_files": [
            f"site:{target} ext:env",
            f"site:{target} ext:log",
            f"site:{target} ext:sql",
            f"site:{target} ext:bak",
            f"site:{target} ext:conf",
            f"site:{target} \"index of\" \"/etc\"",
            f"site:{target} inurl:.git",
        ],
        "login_panels": [
            f"site:{target} inurl:wp-admin",
            f"site:{target} inurl:phpmyadmin",
            f"site:{target} intitle:\"admin panel\"",
            f"site:{target} intitle:\"login\" inurl:admin",
            f"site:{target} inurl:dashboard",
        ],
        "info_gathering": [
            f"site:{target} intitle:\"index of\"",
            f"cache:{target}",
            f"related:{target}",
            f"info:{target}",
            f"link:{target}",
            f"site:{target} \"powered by\"",
            f"site:{target} \"server at\"",
        ],
        "social_media": [
            f"\"{target}\" site:linkedin.com",
            f"\"{target}\" site:twitter.com",
            f"\"{target}\" site:facebook.com",
            f"\"{target}\" site:instagram.com",
        ],
        "email_finding": [
            f"site:{target} \"@{target}\"",
            f"\"{target}\" email OR contact OR \"@\"",
            f"site:{target} intext:\"@gmail.com\" OR intext:\"@yahoo.com\"",
        ],
        "cloud_storage": [
            f"\"{target}\" site:s3.amazonaws.com",
            f"\"{target}\" inurl:blob.core.windows.net",
            f"\"{target}\" site:drive.google.com",
            f"\"{target}\" site:dropbox.com",
            f"\"{target}\" inurl:storage.googleapis.com",
        ],
        "code_leaks": [
            f"site:github.com \"{target}\"",
            f"site:github.com \"{target}\" password",
            f"site:github.com \"{target}\" api_key OR apikey OR secret",
            f"site:pastebin.com \"{target}\"",
            f"site:gitlab.com \"{target}\"",
        ],
        "subdomains": [
            f"site:*.{target} -site:www.{target}",
            f"site:{target} -inurl:www",
        ],
    }

    return {
        "target": target,
        "total_dorks": sum(len(v) for v in dorks.values()),
        "dorks": dorks
    }
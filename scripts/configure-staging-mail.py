"""Read staging SMTP locally from Keycloak. Never emit credentials to CI."""
import base64, json, os, pathlib, subprocess, tempfile
if os.geteuid()!=0: raise RuntimeError("Run through sudo")
root=pathlib.Path("/opt/inventory-management")
path=root/".env.staging"
ids=subprocess.run(["docker","ps","-q","--filter","label=com.docker.compose.project=inventory-identity-staging","--filter","label=com.docker.compose.service=identity-db"],check=True,capture_output=True,text=True).stdout.split()
if len(ids)!=1: raise RuntimeError("Expected one staging identity database")
query="SELECT json_object_agg(s.name,s.value) FROM realm_smtp_config s JOIN realm r ON r.id=s.realm_id WHERE r.name='inventory-staging'"
result=subprocess.run(["docker","exec",ids[0],"psql","-U","keycloak","-d","keycloak","-At","-c",query],capture_output=True,text=True,timeout=20)
if result.returncode: raise RuntimeError("Could not read staging email configuration")
settings=json.loads(result.stdout.strip() or "null") or {}
if not all(settings.get(k) for k in ("host","user","password","from")): raise RuntimeError("Staging SMTP configuration incomplete")
values={"MAIL_"+k.upper()+"_BASE64":base64.b64encode(str(settings.get(v,"587" if k=="Port" else "")).encode()).decode() for k,v in {"Host":"host","Port":"port","Username":"user","Password":"password","From":"from","ImplicitTls":"ssl"}.items()}
original=path.read_text()
lines=[line for line in original.splitlines() if not any(line.startswith(k+"=") for k in values)]
lines.extend(k+"="+v for k,v in values.items())
metadata=path.stat()
with tempfile.NamedTemporaryFile(mode="w",encoding="utf-8",dir=root,prefix=".env.staging.mail-",delete=False) as temporary:
    temporary.write("\n".join(lines)+"\n")
temporary_path=pathlib.Path(temporary.name)
try:
    os.chown(temporary_path,metadata.st_uid,metadata.st_gid)
    temporary_path.chmod(0o600)
    temporary_path.replace(path)
finally:
    temporary_path.unlink(missing_ok=True)
print("Staging invitation email configured locally")

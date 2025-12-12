using Anotame.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Anotame.Controllers
{
    public class LoginController : Controller
    {

        private readonly Response cnResponse = new Response();
        // GET: Login
        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Login(Empleados objUser)
        {
            if (ModelState.IsValid)
            {
                using (AnotameEntities db = new AnotameEntities())
                {
                    var obj = db.Empleados.Where(a => a.Nombre.Equals(objUser.Nombre) && a.Contraseña.Equals(objUser.Contraseña)).FirstOrDefault();
                    if (obj != null)
                    {
                        Session["UserID"] = obj.id.ToString();
                        Session["UserName"] = obj.Nombre.ToString();
                        TempData["Usuario"] = obj.id;
                        return RedirectToAction("UserLogged");
                    }
                }
            }
            return View(objUser);

        }

        public ActionResult UserLogged()
        {
            if (Session["UserID"] != null)
            {
                return RedirectToAction("Create", "Nota");
            }
            else
            {
                return Json(cnResponse.WentBad());
            }
        }
    }
}
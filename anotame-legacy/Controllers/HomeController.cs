using Anotame.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Anotame.Controllers
{
    public class HomeController : Controller
    {
        public QueryNota queryN = new QueryNota();
        private readonly AnotameEntities db = new AnotameEntities();
        private readonly Response cnResponse = new Response();
        public ActionResult Index()
        {
            //ViewBag.folio = queryN.Folio();
            ViewBag.Dueño = db.Empresa.FirstOrDefault().Dueño;
            ViewBag.CURP = db.Empresa.FirstOrDefault().CURP;
            ViewBag.RFC = db.Empresa.FirstOrDefault().RFC;
            ViewBag.Telefono = db.Empresa.FirstOrDefault().Telefono;
            ViewBag.Direccion = db.Empresa.FirstOrDefault().Direccion;
            ViewBag.Rep_Datos = db.Empresa.FirstOrDefault().Rep_Datos;
            ViewBag.Incorp_Fiscal = db.Empresa.FirstOrDefault().Incorp_Fiscal;
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre");
            ViewBag.FechaRecibido = DateTime.Now;
            return View();
        }

        public JsonResult GetCliente(int id)
        {
            return Json(db.Cliente(id));
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Index([Bind(Include = "id,FechaEntrega,FechaRecibido,idEmpresa,Folio,idClientes")] Nota nota)
        {
            if (ModelState.IsValid)
            {
                nota.idEmpresa = 1;

                db.Nota.Add(nota);
                db.SaveChanges();
                return Json(cnResponse.AllOk());
            }

            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            //ViewBag.idNotaPrenda = new SelectList(db.NotaPrenda, "id", "id", nota.idNotaPrenda);
            return Json(cnResponse.WentBad());

        }
    }
}
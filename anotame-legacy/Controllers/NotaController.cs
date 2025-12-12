using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Anotame.Models;

namespace Anotame.Controllers
{
    public class NotaController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();
        private readonly Response cnResponse = new Response();
        public QueryNota queryN = new QueryNota();
        public QueryNotaP queryNP = new QueryNotaP();
        // GET: Nota
        public ActionResult Index()
        {
            var nota = db.Nota.Include(n => n.Clientes).Include(n => n.Empresa);
            return View(nota.ToList());
        }

        // GET: Nota/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            return View(nota);
        }

        // GET: Nota/Create
        public ActionResult Create()
        {
            ViewBag.folio = queryN.Folio();
            ViewBag.Dueño = db.Empresa.FirstOrDefault().Dueño;
            ViewBag.CURP = db.Empresa.FirstOrDefault().CURP;
            ViewBag.RFC = db.Empresa.FirstOrDefault().RFC;
            ViewBag.Telefono = db.Empresa.FirstOrDefault().Telefono;
            ViewBag.Direccion = db.Empresa.FirstOrDefault().Direccion;
            ViewBag.Rep_Datos = db.Empresa.FirstOrDefault().Rep_Datos;
            ViewBag.Incorp_Fiscal = db.Empresa.FirstOrDefault().Incorp_Fiscal;
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre");
            ViewBag.FechaRecibido = DateTime.Now;
            ViewBag.idTipoPrendaEdit = new SelectList(db.TipoPrenda, "id", "Nombre");
            ViewBag.idArregloEdit = new SelectList(db.Arreglo, "id", "Nombre");
            ViewBag.idEmpleado = new SelectList(db.Empleados, "id");
            return View();
        }
   
        public JsonResult FechayFolio()
        {
            var Folio = queryN.Folio();
            var FechaR = DateTime.Now;
            var fechar = Convert.ToString(DateTime.Now.Year + "-" + DateTime.Now.Month + "-" + DateTime.Now.Day );
            return Json(new { Folio, FechaR, fechar });
        }

        public JsonResult GetNotaPrenda(int id)
        {
            var Pr = new SelectList(db.TipoPrenda, "id", "Nombre");
            var Ar = new SelectList(db.Arreglo, "id", "Nombre");

            return Json(new { Edit = db.EditFindNotaPrenda(id), Pr, Ar});
        }

        public JsonResult GetArreglo(int id)
        {
            return Json(db.TipoArregloYPrecio(id));
        }


        // POST: Nota/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create ([Bind(Include = "id,FechaEntrega,FechaRecibido,idEmpresa,Folio,idClientes,Total,idEmpleados")] Nota nota)
        {
            if (ModelState.IsValid)
            {
                nota.idEmpleado = (int)TempData["Usuario"];
                nota.idEmpresa = 1;
                db.Nota.Add(nota);
                db.SaveChanges();
                queryNP.Update(queryN.IdNota());
                return Json(cnResponse.AllOk());
                
            }

            //ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            //ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            //ViewBag.idNotaPrenda = new SelectList(db.NotaPrenda, "id", "id", nota.idNotaPrenda);
            return Json(cnResponse.WentBad());
        }

        // GET: Nota/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            //ViewBag.idNotaPrenda = new SelectList(db.NotaPrenda, "id", "id", nota.idNotaPrenda);
            return View(nota);
        }

        // POST: Nota/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,FechaEntrega,FechaRecibido,idEmpresa,Folio,idNotaPrenda,idClientes")] Nota nota)
        {
            if (ModelState.IsValid)
            {
                db.Entry(nota).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            //ViewBag.idNotaPrenda = new SelectList(db.NotaPrenda, "id", "id", nota.idNotaPrenda);
            return View(nota);
        }

        // GET: Nota/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            return View(nota);
        }

        // POST: Nota/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Nota nota = db.Nota.Find(id);
            db.Nota.Remove(nota);
            db.SaveChanges();
            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}

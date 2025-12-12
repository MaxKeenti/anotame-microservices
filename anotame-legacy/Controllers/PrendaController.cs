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
    public class PrendaController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();
        //public queryPrenda queryP = new queryPrenda();
        // GET: Prenda
        public ActionResult Index()
        {
            var prenda = db.Prenda.Include(p => p.Arreglo).Include(p => p.TipoPrenda);
            return View(prenda.ToList());
        }


        public JsonResult BusqArreglo(string id)
        {
            return Json(db.BusquedaPrAr(id).ToList());
        }

        public JsonResult BusqPrenda (string id)
        {
            return Json(db.BusquedaPr(id).ToList());
        }

        // GET: Prenda/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Prenda prenda = db.Prenda.Find(id);
            if (prenda == null)
            {
                return HttpNotFound();
            }
            return View(prenda);
        }

        // GET: Prenda/Create
        public ActionResult Create()
        {
            ViewBag.idArreglo = new SelectList(db.Arreglo, "id", "Nombre");
            ViewBag.idTipoPrenda = new SelectList(db.TipoPrenda, "id", "Nombre");
            return View();
        }

        // POST: Prenda/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,idTipoPrenda,idArreglo,Cantidad")] Prenda prenda)
        {
            if (ModelState.IsValid)
            {
                db.Prenda.Add(prenda);
                db.SaveChanges();
                return RedirectToAction("Create");
            }

            ViewBag.idArreglo = new SelectList(db.Arreglo, "id", "Nombre", prenda.idArreglo);
            ViewBag.idTipoPrenda = new SelectList(db.TipoPrenda, "id", "Nombre", prenda.idTipoPrenda);
            return View(prenda);
        }

        // GET: Prenda/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Prenda prenda = db.Prenda.Find(id);
            if (prenda == null)
            {
                return HttpNotFound();
            }
            ViewBag.idArreglo = new SelectList(db.Arreglo, "id", "Nombre", prenda.idArreglo);
            ViewBag.idTipoPrenda = new SelectList(db.TipoPrenda, "id", "Nombre", prenda.idTipoPrenda);
            return View(prenda);
        }

        // POST: Prenda/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,idTipoPrenda,idArreglo,Cantidad")] Prenda prenda)
        {
            if (ModelState.IsValid)
            {
                db.Entry(prenda).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Create");
            }
            ViewBag.idArreglo = new SelectList(db.Arreglo, "id", "Nombre", prenda.idArreglo);
            ViewBag.idTipoPrenda = new SelectList(db.TipoPrenda, "id", "Nombre", prenda.idTipoPrenda);
            return View(prenda);
        }

        // GET: Prenda/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Prenda prenda = db.Prenda.Find(id);
            if (prenda == null)
            {
                return HttpNotFound();
            }
            return View(prenda);
        }

        // POST: Prenda/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Prenda prenda = db.Prenda.Find(id);
            db.Prenda.Remove(prenda);
            db.SaveChanges();
            return RedirectToAction("Create");
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

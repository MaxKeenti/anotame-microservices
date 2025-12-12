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
    public class ArregloController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();

        // GET: Arreglo
        public ActionResult Index()
        {
            return View(db.Arreglo.ToList());
        }

        public JsonResult BusqArreglo(string id)
        {
            return Json(db.BusquedaAr(id).ToList());
        }

        // GET: Arreglo/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Arreglo Arreglo = db.Arreglo.Find(id);
            if (Arreglo == null)
            {
                return HttpNotFound();
            }
            return View(Arreglo);
        }

        // GET: Arreglo/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Arreglo/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,Nombre,idPrecio")] Arreglo Arreglo)
        {
            if (ModelState.IsValid)
            {
                db.Arreglo.Add(Arreglo);
                db.SaveChanges();
                return RedirectToAction("Create");
            }

            return View(Arreglo);
        }

        // GET: Arreglo/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Arreglo Arreglo = db.Arreglo.Find(id);
            if (Arreglo == null)
            {
                return HttpNotFound();
            }
            return View(Arreglo);
        }

        // POST: Arreglo/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,Nombre,idPrecio")] Arreglo Arreglo)
        {
            if (ModelState.IsValid)
            {
                db.Entry(Arreglo).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Create");
            }
            return View(Arreglo);
        }

        // GET: Arreglo/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Arreglo Arreglo = db.Arreglo.Find(id);
            if (Arreglo == null)
            {
                return HttpNotFound();
            }
            return View(Arreglo);
        }

        // POST: Arreglo/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Arreglo Arreglo = db.Arreglo.Find(id);
            db.Arreglo.Remove(Arreglo);
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

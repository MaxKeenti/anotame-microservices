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
    public class TipoPrendaController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();

        // GET: TipoPrenda
        public ActionResult Index()
        {
            return View(db.TipoPrenda.ToList());
        }

        public JsonResult BusqTipoPrenda(string id)
        {
            return Json(db.BusquedaTipoPr(id).ToList());
        }

        // GET: TipoPrenda/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TipoPrenda tipoPrenda = db.TipoPrenda.Find(id);
            if (tipoPrenda == null)
            {
                return HttpNotFound();
            }
            return View(tipoPrenda);
        }

        // GET: TipoPrenda/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: TipoPrenda/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,Nombre")] TipoPrenda tipoPrenda)
        {
            if (ModelState.IsValid)
            {
                db.TipoPrenda.Add(tipoPrenda);
                db.SaveChanges();
                return RedirectToAction("Create");
            }

            return View(tipoPrenda);
        }

        // GET: TipoPrenda/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TipoPrenda tipoPrenda = db.TipoPrenda.Find(id);
            if (tipoPrenda == null)
            {
                return HttpNotFound();
            }
            return View(tipoPrenda);
        }

        // POST: TipoPrenda/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,Nombre")] TipoPrenda tipoPrenda)
        {
            if (ModelState.IsValid)
            {
                db.Entry(tipoPrenda).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Create");
            }
            return View(tipoPrenda);
        }

        // GET: TipoPrenda/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TipoPrenda tipoPrenda = db.TipoPrenda.Find(id);
            if (tipoPrenda == null)
            {
                return HttpNotFound();
            }
            return View(tipoPrenda);
        }

        // POST: TipoPrenda/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            TipoPrenda tipoPrenda = db.TipoPrenda.Find(id);
            db.TipoPrenda.Remove(tipoPrenda);
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
